"""
SafeGuard AI Engine — Weekly Digest Generator + Conversation Coach
Uses Groq (Llama 3.1) to generate parent-friendly summaries and conversation starters.
"""

import json
from typing import Optional

from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from config import GOOGLE_PLACES_API_KEY  # unused but keeps import structure


GROQ_API_KEY = "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"
GROQ_MODEL = "llama-3.1-8b-instant"

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


class DigestInput(BaseModel):
    """Input data for weekly digest generation."""
    child_id: str
    parent_id: str
    child_age: int = 14
    composite_risk: float = Field(default=0.0, ge=0.0, le=100.0)
    top_flags: list[str] = []
    behaviour_anomalies: list[str] = []
    content_flags: list[str] = []
    grooming_contacts_count: int = 0
    high_risk_contacts: int = 0
    week_summary_stats: dict = {}
    # e.g., {"total_screen_time_hrs": 28, "late_night_sessions": 5, "new_contacts": 2}


class DigestResult(BaseModel):
    """Output: narrative + conversation starter for parent."""
    child_id: str
    parent_id: str
    composite_risk: float
    risk_category: str
    narrative: str
    conversation_starter: str
    action_items: list[str] = []


DIGEST_SYSTEM_PROMPT = """You are a child safety advisor. Your role is to help parents understand their child's digital activity patterns and have productive conversations about online safety.

Your tone is:
- Supportive, not alarmist
- Empowering, not panic-inducing
- Factual, not judgmental
- Practical, with actionable guidance

You NEVER reveal specific message content (you don't have it).
You discuss patterns and behaviours, not surveillance findings.

Return ONLY valid JSON in this exact format:
{
  "narrative": "<3-4 sentence plain-English summary for the parent>",
  "conversation_starter": "<A natural, non-confrontational way to bring up concerns with the child>",
  "action_items": ["<specific action 1>", "<specific action 2>"]
}"""


COACHING_SYSTEM_PROMPT = """You are a family communication coach specializing in digital safety conversations between parents and children (ages 10-17).

Your guidance must be:
- Age-appropriate for the child
- Non-confrontational (child should not feel surveilled)
- Trust-building (strengthens relationship, doesn't damage it)
- Specific and actionable (not generic advice)

Return ONLY valid JSON:
{
  "conversation_starter": "<exact opening line the parent can use>",
  "follow_up_questions": ["<question 1>", "<question 2>", "<question 3>"],
  "things_to_avoid": ["<what NOT to say 1>", "<what NOT to say 2>"],
  "positive_framing": "<how to frame this as caring, not controlling>"
}"""


def _determine_risk_category(score: float) -> str:
    """Map composite risk score to category."""
    if score >= 75:
        return "critical"
    elif score >= 50:
        return "high"
    elif score >= 30:
        return "moderate"
    return "low"


async def generate_weekly_digest(input_data: DigestInput) -> DigestResult:
    """
    Generate a weekly digest narrative and conversation starter using GPT-4o-mini.

    Runs: daily batch (cron) + immediately on critical flag.
    Tone: Supportive, not alarmist. Empowers parent, doesn't panic.
    """
    risk_category = _determine_risk_category(input_data.composite_risk)

    user_message = f"""Generate a weekly safety digest for a parent of a {input_data.child_age}-year-old child.

Weekly data:
- Composite risk score: {input_data.composite_risk}/100 ({risk_category})
- Top flags this week: {', '.join(input_data.top_flags) if input_data.top_flags else 'None'}
- Behaviour anomalies: {', '.join(input_data.behaviour_anomalies) if input_data.behaviour_anomalies else 'None'}
- Content flags: {', '.join(input_data.content_flags) if input_data.content_flags else 'None'}
- Contacts flagged for grooming patterns: {input_data.grooming_contacts_count}
- High-risk contacts: {input_data.high_risk_contacts}
- Stats: {json.dumps(input_data.week_summary_stats)}

Remember: Be supportive, not alarmist. Help the parent understand and act, not panic."""

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": DIGEST_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.5,
            max_tokens=400,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)

        return DigestResult(
            child_id=input_data.child_id,
            parent_id=input_data.parent_id,
            composite_risk=input_data.composite_risk,
            risk_category=risk_category,
            narrative=result.get("narrative", "No significant concerns this week."),
            conversation_starter=result.get("conversation_starter", "How's everything going online lately?"),
            action_items=result.get("action_items", []),
        )

    except Exception as e:
        # Fallback narrative based on risk level
        fallback_narratives = {
            "low": "Your child's digital activity this week shows normal patterns. No significant concerns detected.",
            "moderate": "Some patterns this week are worth noting. Consider checking in with your child about their online interactions.",
            "high": "This week showed some concerning patterns in your child's digital activity. A conversation about online safety would be beneficial.",
            "critical": "Important: This week's activity patterns suggest your child may need your attention regarding online interactions. Please review the flags below.",
        }

        return DigestResult(
            child_id=input_data.child_id,
            parent_id=input_data.parent_id,
            composite_risk=input_data.composite_risk,
            risk_category=risk_category,
            narrative=fallback_narratives.get(risk_category, fallback_narratives["low"]),
            conversation_starter="Hey, I wanted to check in — how are things going with your friends online?",
            action_items=["Review flagged contacts", "Have an open conversation about online safety"],
        )


async def generate_conversation_coach(
    child_age: int,
    concern_type: str,
    flags: list[str],
    risk_level: str = "moderate",
) -> dict:
    """
    Generate specific conversation coaching for a parent.

    Tells parents HOW to talk to their child about detected concerns
    without breaking trust or revealing surveillance.
    """
    user_message = f"""A parent needs to talk to their {child_age}-year-old about a digital safety concern.

Concern type: {concern_type}
Specific flags: {', '.join(flags)}
Risk level: {risk_level}

Generate a conversation guide that helps the parent bring this up naturally without:
- Making the child feel spied on
- Damaging trust
- Being accusatory
- Using technical jargon the child won't understand"""

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": COACHING_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.6,
            max_tokens=350,
            response_format={"type": "json_object"},
        )

        return json.loads(response.choices[0].message.content)

    except Exception:
        return {
            "conversation_starter": f"Hey, I've been thinking about online safety lately. Can we chat about it?",
            "follow_up_questions": [
                "Have you met anyone new online recently?",
                "Is there anything online that's made you uncomfortable?",
                "Do you know what to do if someone makes you feel weird online?",
            ],
            "things_to_avoid": [
                "Don't accuse or interrogate",
                "Don't threaten to take away their phone",
            ],
            "positive_framing": "Frame it as caring about their wellbeing, not controlling their behaviour.",
        }
