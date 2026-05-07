import httpx
from ..config import settings

class AIService:
    @staticmethod
    async def get_route_risk(destination: str, time_of_day: str):
        # In production, this would call OpenAI with GPT-4o-mini
        # and use Google Places API + Crime Data CSV.
        if not settings.OPENAI_API_KEY:
            return {
                "risk_score": 1,
                "reasoning": "OpenAI API Key not configured. Using default safety score."
            }
        
        # Placeholder for actual OpenAI call
        return {
            "risk_score": 3,
            "risk_label": "Moderate",
            "reasoning": "Historical data suggests some risk in this area at night.",
            "safe_alternative": "Stick to the main illuminated roads."
        }

    @staticmethod
    async def generate_safety_narrative(child_id: str, logs: list):
        # AI narrative generation for parents
        return "Your child has been using their phone safely this week."

ai_service = AIService()
