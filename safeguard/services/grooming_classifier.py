"""
SafeGuard AI Engine — Grooming Pattern Classifier
MiniLM-based classifier that scores conversation metadata for grooming patterns.
Privacy-preserving: only scores and flag types are processed, never raw message text.
"""

from typing import Optional

import numpy as np
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

from config import GROOMING_ALERT_MIN_FLAGS


# Load quantized MiniLM model (~17MB)
# In production on-device, this runs on the child's phone.
# This server-side instance is for validation and re-scoring.
_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the MiniLM model."""
    global _model
    if _model is None:
        _model = SentenceTransformer("paraphrase-MiniLM-L3-v2")
    return _model


# Grooming pattern phrase clusters (used for semantic similarity matching)
GROOMING_PATTERNS = {
    "secrecy_language": [
        "don't tell anyone",
        "this is our secret",
        "just between us",
        "don't show your parents",
        "keep this private",
    ],
    "platform_migration": [
        "add me on snapchat",
        "let's talk on signal",
        "message me on telegram",
        "switch to another app",
        "this app isn't safe for us",
    ],
    "gift_language": [
        "I'll send you something",
        "I can get you",
        "do you want a gift",
        "I'll buy you",
        "let me get that for you",
    ],
    "isolation_tactics": [
        "your friends don't understand",
        "only I care about you",
        "they wouldn't get it",
        "you can only trust me",
        "don't listen to them",
    ],
    "age_gap_indicators": [
        "you're mature for your age",
        "age is just a number",
        "you're not like other kids",
        "you seem older",
        "you're so grown up",
    ],
}


class GroomingInput(BaseModel):
    """Input metadata from on-device classifier (no raw message text)."""
    child_id: str
    contact_hash: str  # SHA-256 hashed contact ID
    message_frequency_per_hour: float = 0.0
    is_new_contact: bool = False
    contact_in_phone_book: bool = True
    platform_type: str = "standard"  # "standard" | "encrypted"
    late_night_message_ratio: float = 0.0  # 0–1, fraction of messages after 10pm
    flagged_phrases: list[str] = []  # Phrase category flags detected on-device
    conversation_duration_days: int = 0
    message_count_48h: int = 0  # Messages in last 48 hours (frequency escalation)


class GroomingResult(BaseModel):
    """Output: grooming risk score and flags."""
    child_id: str
    contact_hash: str
    grooming_score: float = Field(..., ge=0.0, le=1.0)
    flags: list[str] = []
    alert_parent: bool = False
    risk_category: str = "low"  # "low" | "moderate" | "high" | "critical"


def _compute_metadata_score(input_data: GroomingInput) -> tuple[float, list[str]]:
    """
    Compute a risk score from conversation metadata features.
    Returns (score 0–1, list of triggered flags).
    """
    score = 0.0
    flags = []

    # New contact not in phone book
    if input_data.is_new_contact and not input_data.contact_in_phone_book:
        score += 0.15
        flags.append("unknown_contact")

    # Rapid frequency escalation (many messages in 48h from new contact)
    if input_data.message_count_48h > 50 and input_data.conversation_duration_days < 7:
        score += 0.20
        flags.append("frequency_escalation")
    elif input_data.message_count_48h > 20 and input_data.conversation_duration_days < 3:
        score += 0.15
        flags.append("frequency_escalation")

    # Late-night messaging pattern
    if input_data.late_night_message_ratio > 0.4:
        score += 0.15
        flags.append("late_night_pattern")
    elif input_data.late_night_message_ratio > 0.2:
        score += 0.08

    # Encrypted platform (higher weight — suggests desire to hide)
    if input_data.platform_type == "encrypted":
        score += 0.10
        flags.append("encrypted_platform")

    # High message frequency
    if input_data.message_frequency_per_hour > 10:
        score += 0.10
        flags.append("high_frequency")

    # On-device flagged phrase categories
    phrase_flag_map = {
        "secrecy": "secrecy_language",
        "secret": "secrecy_language",
        "platform": "platform_migration",
        "migration": "platform_migration",
        "gift": "gift_language",
        "isolation": "isolation_tactics",
        "age": "age_gap_indicators",
    }

    detected_categories = set()
    for phrase in input_data.flagged_phrases:
        phrase_lower = phrase.lower()
        for key, category in phrase_flag_map.items():
            if key in phrase_lower:
                detected_categories.add(category)

        # Direct category match
        if phrase_lower in GROOMING_PATTERNS:
            detected_categories.add(phrase_lower)

    for category in detected_categories:
        score += 0.12
        flags.append(category)

    return min(1.0, score), flags


def _compute_semantic_score(flagged_phrases: list[str]) -> tuple[float, list[str]]:
    """
    Use MiniLM to compute semantic similarity between flagged phrases
    and known grooming pattern clusters.
    Returns (score 0–1, list of matched pattern categories).
    """
    if not flagged_phrases:
        return 0.0, []

    model = _get_model()
    matched_categories = []
    max_scores = []

    # Encode input phrases
    input_embeddings = model.encode(flagged_phrases, convert_to_numpy=True)

    for category, patterns in GROOMING_PATTERNS.items():
        pattern_embeddings = model.encode(patterns, convert_to_numpy=True)

        # Compute cosine similarity between each input and each pattern
        # input_embeddings: (N, D), pattern_embeddings: (M, D)
        similarities = np.dot(input_embeddings, pattern_embeddings.T)
        norms_input = np.linalg.norm(input_embeddings, axis=1, keepdims=True)
        norms_pattern = np.linalg.norm(pattern_embeddings, axis=1, keepdims=True)
        cosine_sim = similarities / (norms_input @ norms_pattern.T + 1e-8)

        max_sim = float(cosine_sim.max())
        if max_sim > 0.65:  # Threshold for semantic match
            matched_categories.append(category)
            max_scores.append(max_sim)

    if not max_scores:
        return 0.0, []

    # Average of top matches, scaled to 0–1
    semantic_score = min(1.0, float(np.mean(max_scores)))
    return semantic_score, matched_categories


def score_grooming_risk(input_data: GroomingInput) -> GroomingResult:
    """
    Compute composite grooming risk score.

    Combines metadata-based scoring with semantic similarity analysis.
    Privacy-preserving: no raw message text is processed.
    """
    # Metadata-based score
    metadata_score, metadata_flags = _compute_metadata_score(input_data)

    # Semantic similarity score (only if flagged phrases provided)
    semantic_score, semantic_flags = _compute_semantic_score(input_data.flagged_phrases)

    # Combine: 60% metadata, 40% semantic
    composite_score = (metadata_score * 0.6) + (semantic_score * 0.4)
    composite_score = min(1.0, composite_score)

    # Merge flags (deduplicate)
    all_flags = list(set(metadata_flags + semantic_flags))

    # Determine risk category
    if composite_score >= 0.75:
        risk_category = "critical"
    elif composite_score >= 0.50:
        risk_category = "high"
    elif composite_score >= 0.30:
        risk_category = "moderate"
    else:
        risk_category = "low"

    # Alert parent only if enough flag types are present (prevent false positives)
    alert_parent = (
        len(all_flags) >= GROOMING_ALERT_MIN_FLAGS
        or risk_category in ("high", "critical")
    )

    return GroomingResult(
        child_id=input_data.child_id,
        contact_hash=input_data.contact_hash,
        grooming_score=round(composite_score, 4),
        flags=all_flags,
        alert_parent=alert_parent,
        risk_category=risk_category,
    )
