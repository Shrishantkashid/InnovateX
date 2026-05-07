import sys
import os
from datetime import datetime

# Add the parent directory to sys.path to import from services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.threat_engine import threat_engine

def test_m1_threat_logic():
    print("Testing M1 Threat Logic...")
    
    # Low audio confidence
    score = threat_engine.calculate_threat_score("m1", [{"type": "audio", "value": 0.5}])
    print(f"Score for 0.5 audio: {score}")
    assert score < 40
    
    # High audio confidence
    score = threat_engine.calculate_threat_score("m1", [{"type": "audio", "value": 0.8}])
    print(f"Score for 0.8 audio: {score}")
    assert score >= 40

def test_m2_threat_logic():
    print("\nTesting M2 Threat Logic...")
    
    # High audio confidence for child (lower threshold)
    score = threat_engine.calculate_threat_score("m2", [{"type": "audio", "value": 0.6}])
    print(f"Score for 0.6 audio (M2): {score}")
    assert score >= 40

    # Zone exit
    score = threat_engine.calculate_threat_score("m2", [{"type": "zone_exit", "value": 1.0}])
    print(f"Score for zone exit (M2): {score}")
    assert score >= 50

def test_time_weight():
    print("\nTesting Time Weight...")
    # This is hard to test deterministically without mocking datetime, 
    # but we can see if it adds 15 or not based on current time.
    now = datetime.now()
    score_no_signals = threat_engine.calculate_threat_score("m1", [])
    print(f"Current hour: {now.hour}")
    print(f"Base score (no signals): {score_no_signals}")
    
    if now.hour >= 22 or now.hour < 5:
        assert score_no_signals == 15
    else:
        assert score_no_signals == 0

def test_aadhaar_logic():
    print("\nTesting Aadhaar Service Logic...")
    from services.aadhaar_service import AadhaarService
    from unittest.mock import AsyncMock, patch
    
    service = AadhaarService()
    
    # Mock authentication
    service._get_access_token = AsyncMock(return_value="mock_token")
    
    # Mock sending OTP
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value.json = lambda: {"status": "success", "data": {"reference_id": "ref123"}}
        mock_post.return_value.status_code = 200
        
        import asyncio
        result = asyncio.run(service.send_otp("123456789012"))
        print(f"OTP Send Result: {result}")
        assert result["data"]["reference_id"] == "ref123"

if __name__ == "__main__":
    test_m1_threat_logic()
    test_m2_threat_logic()
    test_time_weight()
    test_aadhaar_logic()
    print("\nAll unit tests passed!")
