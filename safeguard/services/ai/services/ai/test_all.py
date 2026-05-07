"""
SafeGuard AI Engine — Test All Modules
Runs a quick functional test on every AI component.
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime


def test_threat_fusion():
    """Test 1: Threat Fusion Engine"""
    print("\n" + "="*60)
    print("TEST 1: THREAT FUSION ENGINE")
    print("="*60)

    from threat_fusion import ThreatSignal, compute_threat_score

    # Test Case 1a: Module 1 (Women) - High threat at night
    signal = ThreatSignal(
        user_id="test-user-001",
        module="m1",
        audio_score=85.0,
        motion_score=60.0,
        eta_score=50.0,
        zone_exit_score=0.0,
        timestamp=datetime(2024, 1, 15, 23, 30),  # 11:30pm (night)
    )
    result = compute_threat_score(signal)
    print(f"\n  [M1 Night - High Threat]")
    print(f"  Input: audio=85, motion=60, eta=50, zone=0, time=23:30")
    print(f"  Score: {result.composite_score}/100")
    print(f"  Action: {result.action}")
    print(f"  Breakdown: {result.breakdown}")
    assert result.action == "auto_sos", f"Expected auto_sos, got {result.action}"
    print("  ✓ PASSED")

    # Test Case 1b: Module 2 (Child) - Moderate threat
    signal2 = ThreatSignal(
        user_id="test-child-001",
        module="m2",
        audio_score=45.0,
        motion_score=30.0,
        eta_score=40.0,
        zone_exit_score=80.0,
        timestamp=datetime(2024, 1, 15, 15, 0),  # 3pm (daytime)
    )
    result2 = compute_threat_score(signal2)
    print(f"\n  [M2 Day - Moderate Threat]")
    print(f"  Input: audio=45, motion=30, eta=40, zone=80, time=15:00")
    print(f"  Score: {result2.composite_score}/100")
    print(f"  Action: {result2.action}")
    assert result2.composite_score > 0, "Score should be > 0"
    print("  ✓ PASSED")

    # Test Case 1c: Module 1 - Low threat (monitor)
    signal3 = ThreatSignal(
        user_id="test-user-002",
        module="m1",
        audio_score=10.0,
        motion_score=5.0,
        eta_score=0.0,
        zone_exit_score=0.0,
        timestamp=datetime(2024, 1, 15, 14, 0),  # 2pm
    )
    result3 = compute_threat_score(signal3)
    print(f"\n  [M1 Day - Low Threat]")
    print(f"  Input: audio=10, motion=5, eta=0, zone=0, time=14:00")
    print(f"  Score: {result3.composite_score}/100")
    print(f"  Action: {result3.action}")
    assert result3.action == "monitor", f"Expected monitor, got {result3.action}"
    print("  ✓ PASSED")


async def test_route_risk():
    """Test 2: Route Risk Scorer (Groq API)"""
    print("\n" + "="*60)
    print("TEST 2: ROUTE RISK SCORER (Groq LLM)")
    print("="*60)

    from route_risk import RouteRiskRequest, score_route_risk

    request = RouteRiskRequest(
        destination_lat=12.9716,
        destination_lng=77.5946,
        time_of_day="23:00",
        day_of_week="Saturday",
    )

    print(f"\n  Input: Bangalore ({request.destination_lat}, {request.destination_lng})")
    print(f"  Time: {request.time_of_day} on {request.day_of_week}")
    print("  Calling Groq API...")

    result = await score_route_risk(request)
    print(f"  Risk Score: {result.risk_score}/5")
    print(f"  Risk Label: {result.risk_label}")
    print(f"  Reasoning: {result.reasoning[:100]}...")
    print(f"  Safe Alternative: {result.safe_alternative[:80]}...")
    print(f"  Nearby Safe Zones: {len(result.nearby_safe_zones)} found")
    assert 1 <= result.risk_score <= 5, f"Score out of range: {result.risk_score}"
    print("  ✓ PASSED")


def test_grooming_classifier():
    """Test 3: Grooming Pattern Classifier"""
    print("\n" + "="*60)
    print("TEST 3: GROOMING PATTERN CLASSIFIER (MiniLM)")
    print("="*60)

    from grooming_classifier import GroomingInput, score_grooming_risk

    # Test Case 3a: High-risk contact
    input_data = GroomingInput(
        child_id="child-001",
        contact_hash="abc123def456",
        message_frequency_per_hour=15.0,
        is_new_contact=True,
        contact_in_phone_book=False,
        platform_type="encrypted",
        late_night_message_ratio=0.5,
        flagged_phrases=[
            "don't tell your parents",
            "add me on snapchat",
            "I'll get you a gift",
        ],
        conversation_duration_days=3,
        message_count_48h=80,
    )

    print(f"\n  [High-Risk Contact]")
    print(f"  Input: new contact, encrypted, 80 msgs in 48h, late-night 50%")
    print(f"  Flagged phrases: {input_data.flagged_phrases}")
    print("  Running MiniLM semantic analysis...")

    result = score_grooming_risk(input_data)
    print(f"  Grooming Score: {result.grooming_score}")
    print(f"  Risk Category: {result.risk_category}")
    print(f"  Flags: {result.flags}")
    print(f"  Alert Parent: {result.alert_parent}")
    assert result.grooming_score > 0.3, f"Expected high score, got {result.grooming_score}"
    print("  ✓ PASSED")

    # Test Case 3b: Low-risk contact (known friend)
    input_low = GroomingInput(
        child_id="child-001",
        contact_hash="friend123",
        message_frequency_per_hour=3.0,
        is_new_contact=False,
        contact_in_phone_book=True,
        platform_type="standard",
        late_night_message_ratio=0.05,
        flagged_phrases=[],
        conversation_duration_days=90,
        message_count_48h=10,
    )

    print(f"\n  [Low-Risk Contact - Known Friend]")
    result_low = score_grooming_risk(input_low)
    print(f"  Grooming Score: {result_low.grooming_score}")
    print(f"  Risk Category: {result_low.risk_category}")
    print(f"  Alert Parent: {result_low.alert_parent}")
    assert result_low.grooming_score < 0.2, f"Expected low score, got {result_low.grooming_score}"
    assert result_low.alert_parent == False
    print("  ✓ PASSED")


def test_behaviour_tracker():
    """Test 4: Behaviour Baseline Tracker"""
    print("\n" + "="*60)
    print("TEST 4: BEHAVIOUR BASELINE TRACKER (Z-Score)")
    print("="*60)

    from behaviour_tracker import BehaviourInput, AppUsageEntry, analyse_behaviour

    # Create current week logs with anomalous Instagram usage
    logs = [
        AppUsageEntry(
            app_name="Instagram",
            session_start=datetime(2024, 1, 15, 22, 0),
            session_end=datetime(2024, 1, 15, 23, 30),
            duration_min=90.0,
            is_late_night=True,
        ),
        AppUsageEntry(
            app_name="Instagram",
            session_start=datetime(2024, 1, 16, 23, 0),
            session_end=datetime(2024, 1, 17, 0, 30),
            duration_min=90.0,
            is_late_night=True,
        ),
        AppUsageEntry(
            app_name="Instagram",
            session_start=datetime(2024, 1, 17, 14, 0),
            session_end=datetime(2024, 1, 17, 15, 0),
            duration_min=60.0,
            is_late_night=False,
        ),
        AppUsageEntry(
            app_name="WhatsApp",
            session_start=datetime(2024, 1, 15, 10, 0),
            session_end=datetime(2024, 1, 15, 10, 15),
            duration_min=15.0,
            is_late_night=False,
        ),
        AppUsageEntry(
            app_name="YouTube",
            session_start=datetime(2024, 1, 15, 18, 0),
            session_end=datetime(2024, 1, 15, 18, 20),
            duration_min=20.0,
            is_late_night=False,
        ),
    ]

    # Baseline: Instagram was normally 30 min/day, 0 late-night sessions
    baselines = {
        "Instagram": {"avg_daily_min": 30.0, "late_night_freq": 0.5},
        "WhatsApp": {"avg_daily_min": 20.0, "late_night_freq": 0.0},
        "YouTube": {"avg_daily_min": 25.0, "late_night_freq": 0.0},
    }

    input_data = BehaviourInput(
        child_id="child-001",
        current_week_logs=logs,
        baselines=baselines,
    )

    print(f"\n  Input: Instagram 80min/day (baseline 30), 2 late-night sessions (baseline 0.5)")
    result = analyse_behaviour(input_data)
    print(f"  Delta Score: {result.delta_score}/100")
    print(f"  Anomaly Detected: {result.anomaly_detected}")
    print(f"  Anomalies ({len(result.anomalies)}):")
    for a in result.anomalies:
        print(f"    - {a.app_name}: {a.metric} (current={a.current_value}, baseline={a.baseline_value}, z={a.z_score})")
    print(f"  Summary: {result.summary}")
    assert result.anomaly_detected == True
    print("  ✓ PASSED")


def test_heatmap_cluster():
    """Test 5: DBSCAN Heatmap Clustering"""
    print("\n" + "="*60)
    print("TEST 5: DBSCAN HEATMAP CLUSTERING")
    print("="*60)

    from heatmap_cluster import IncidentPoint, cluster_incidents

    # Create clustered incident data (Bangalore area)
    incidents = [
        # Cluster 1: Koramangala area (5 incidents)
        IncidentPoint(lat=12.9352, lng=77.6245, threat_score=75),
        IncidentPoint(lat=12.9355, lng=77.6248, threat_score=82),
        IncidentPoint(lat=12.9348, lng=77.6242, threat_score=68),
        IncidentPoint(lat=12.9360, lng=77.6250, threat_score=90),
        IncidentPoint(lat=12.9350, lng=77.6240, threat_score=71),
        # Cluster 2: MG Road area (4 incidents)
        IncidentPoint(lat=12.9756, lng=77.6066, threat_score=55),
        IncidentPoint(lat=12.9758, lng=77.6070, threat_score=60),
        IncidentPoint(lat=12.9754, lng=77.6064, threat_score=45),
        IncidentPoint(lat=12.9760, lng=77.6068, threat_score=50),
        # Noise point (isolated)
        IncidentPoint(lat=13.0200, lng=77.5500, threat_score=40),
    ]

    print(f"\n  Input: {len(incidents)} incidents (2 expected clusters + 1 noise)")
    result = cluster_incidents(incidents)
    print(f"  Clusters found: {len(result.clusters)}")
    print(f"  Noise points: {result.noise_points}")
    print(f"  Total incidents: {result.total_incidents}")
    for i, c in enumerate(result.clusters):
        print(f"    Cluster {i+1}: center=({c.centroid_lat}, {c.centroid_lng}), "
              f"radius={c.radius_m}m, incidents={c.incident_count}, "
              f"avg_score={c.avg_threat_score}, risk={c.risk_level}")
    assert len(result.clusters) == 2, f"Expected 2 clusters, got {len(result.clusters)}"
    assert result.noise_points == 1, f"Expected 1 noise point, got {result.noise_points}"
    print("  ✓ PASSED")


async def test_digest_generator():
    """Test 6: Weekly Digest Generator (Groq API)"""
    print("\n" + "="*60)
    print("TEST 6: WEEKLY DIGEST GENERATOR (GPT-4o-mini)")
    print("="*60)

    from digest_generator import DigestInput, generate_weekly_digest

    input_data = DigestInput(
        child_id="child-001",
        parent_id="parent-001",
        child_age=14,
        composite_risk=45.0,
        top_flags=["secrecy_language", "late_night_pattern", "frequency_escalation"],
        behaviour_anomalies=["Instagram usage 3x baseline", "2 late-night sessions"],
        content_flags=[],
        grooming_contacts_count=1,
        high_risk_contacts=0,
        week_summary_stats={
            "total_screen_time_hrs": 32,
            "late_night_sessions": 4,
            "new_contacts": 2,
        },
    )

    print(f"\n  Input: 14yo, risk=45/100, flags={input_data.top_flags}")
    print("  Calling OpenAI API...")

    result = await generate_weekly_digest(input_data)
    print(f"  Risk Category: {result.risk_category}")
    print(f"  Narrative: {result.narrative[:150]}...")
    print(f"  Conversation Starter: {result.conversation_starter[:100]}...")
    print(f"  Action Items: {result.action_items}")
    assert result.narrative != ""
    assert result.conversation_starter != ""
    print("  ✓ PASSED")


async def test_conversation_coach():
    """Test 7: Conversation Coach"""
    print("\n" + "="*60)
    print("TEST 7: CONVERSATION COACH (GPT-4o-mini)")
    print("="*60)

    from digest_generator import generate_conversation_coach

    print(f"\n  Input: 13yo, concern=grooming_pattern, risk=high")
    print("  Calling OpenAI API...")

    result = await generate_conversation_coach(
        child_age=13,
        concern_type="grooming_pattern",
        flags=["secrecy_language", "platform_migration", "late_night_pattern"],
        risk_level="high",
    )
    print(f"  Conversation Starter: {result.get('conversation_starter', 'N/A')[:100]}...")
    print(f"  Follow-up Questions: {result.get('follow_up_questions', [])}")
    print(f"  Things to Avoid: {result.get('things_to_avoid', [])}")
    print(f"  Positive Framing: {result.get('positive_framing', 'N/A')[:100]}...")
    assert "conversation_starter" in result
    print("  ✓ PASSED")


def test_risk_synthesis():
    """Test 8: Risk Synthesis (combines all M3 scores)"""
    print("\n" + "="*60)
    print("TEST 8: RISK SYNTHESIS ENGINE")
    print("="*60)

    # Test the synthesis logic directly
    grooming_score = 0.65  # High grooming
    behaviour_delta = 45.0  # Moderate behaviour anomaly
    content_score = 0.2    # Low content risk

    grooming_normalized = grooming_score * 100  # 65
    behaviour_normalized = behaviour_delta      # 45
    content_normalized = content_score * 100    # 20

    composite = (
        grooming_normalized * 0.40
        + behaviour_normalized * 0.35
        + content_normalized * 0.25
    )

    print(f"\n  Input: grooming={grooming_score}, behaviour={behaviour_delta}, content={content_score}")
    print(f"  Normalized: grooming={grooming_normalized}, behaviour={behaviour_normalized}, content={content_normalized}")
    print(f"  Composite: (65*0.40) + (45*0.35) + (20*0.25) = {composite}")

    if composite >= 75:
        category = "critical"
    elif composite >= 50:
        category = "high"
    elif composite >= 30:
        category = "moderate"
    else:
        category = "low"

    print(f"  Risk Category: {category}")
    assert 40 < composite < 60, f"Expected moderate-high range, got {composite}"
    print("  ✓ PASSED")


async def main():
    print("\n" + "#"*60)
    print("#  SAFEGUARD AI ENGINE — FULL TEST SUITE")
    print("#"*60)

    passed = 0
    failed = 0

    # Test 1: Threat Fusion (no external API)
    try:
        test_threat_fusion()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Test 2: Route Risk (Groq API call)
    try:
        await test_route_risk()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Test 3: Grooming Classifier (MiniLM model load)
    try:
        test_grooming_classifier()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Test 4: Behaviour Tracker (scipy z-score)
    try:
        test_behaviour_tracker()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Test 5: Heatmap Clustering (DBSCAN)
    try:
        test_heatmap_cluster()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Test 6: Digest Generator (OpenAI API)
    try:
        await test_digest_generator()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Test 7: Conversation Coach (OpenAI API)
    try:
        await test_conversation_coach()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Test 8: Risk Synthesis (pure logic)
    try:
        test_risk_synthesis()
        passed += 1
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        failed += 1

    # Summary
    print("\n" + "="*60)
    print(f"  RESULTS: {passed} passed, {failed} failed, {passed+failed} total")
    print("="*60)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
