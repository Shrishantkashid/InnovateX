"""
SafeGuard AI Engine — Route Risk Scorer
Uses GPT-4o-mini to assess route safety based on destination, time, and crime data.
"""

import json
from typing import Optional

import httpx
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from config import GOOGLE_PLACES_API_KEY


GROQ_API_KEY = "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"
GROQ_MODEL = "llama-3.1-8b-instant"

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


class RouteRiskRequest(BaseModel):
    """Input for route risk assessment."""
    destination_lat: float
    destination_lng: float
    time_of_day: str  # HH:MM format (24h)
    day_of_week: Optional[str] = None  # e.g., "Monday"
    user_id: Optional[str] = None


class SafeZone(BaseModel):
    """A nearby safe location."""
    name: str
    lat: float
    lng: float
    type: str = ""


class RouteRiskResponse(BaseModel):
    """Output of route risk assessment."""
    risk_score: int = Field(..., ge=1, le=5)
    risk_label: str
    reasoning: str
    safe_alternative: str
    nearby_safe_zones: list[SafeZone] = []


# Bundled NCRB crime data summary (simplified for hackathon)
# In production, this would be loaded from a CSV filtered by district.
NCRB_CRIME_CONTEXT = """
Crime statistics context (NCRB India, aggregated):
- Crimes against women peak between 9pm and 2am in urban areas.
- Isolated areas, construction zones, and poorly lit roads have 3x incident rates.
- Areas near bus stops and metro stations are relatively safer due to CCTV coverage.
- Weekend nights (Fri/Sat) show 40% higher incident rates than weekday nights.
- Commercial areas are safer than residential back-lanes after dark.
"""

SYSTEM_PROMPT = """You are a women's safety analyst for Indian cities. Given a destination coordinate, time of day, and nearby crime incident data, return a JSON risk assessment.

Be specific and practical. Consider:
- Time of day (night hours 9pm-5am are higher risk)
- Day of week (weekends are higher risk at night)
- Area characteristics inferred from coordinates
- Availability of nearby safe zones (police stations, hospitals, metro)

Return ONLY valid JSON in this exact format:
{
  "risk_score": <integer 1-5>,
  "risk_label": "<Very Low|Low|Moderate|High|Very High>",
  "reasoning": "<2-3 sentence explanation>",
  "safe_alternative": "<suggestion for safer route or precaution>"
}"""


async def _fetch_nearby_safe_zones(lat: float, lng: float) -> list[SafeZone]:
    """Fetch nearby police stations, hospitals, and metro stations via Google Places."""
    if not GOOGLE_PLACES_API_KEY:
        return []

    safe_zones = []
    place_types = ["police", "hospital", "subway_station"]

    async with httpx.AsyncClient(timeout=5.0) as http_client:
        for place_type in place_types:
            try:
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    "location": f"{lat},{lng}",
                    "radius": 2000,  # 2km radius
                    "type": place_type,
                    "key": GOOGLE_PLACES_API_KEY,
                }
                resp = await http_client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for result in data.get("results", [])[:2]:  # Top 2 per type
                        loc = result.get("geometry", {}).get("location", {})
                        safe_zones.append(SafeZone(
                            name=result.get("name", "Unknown"),
                            lat=loc.get("lat", 0),
                            lng=loc.get("lng", 0),
                            type=place_type,
                        ))
            except (httpx.RequestError, httpx.TimeoutException):
                continue

    return safe_zones


async def score_route_risk(request: RouteRiskRequest) -> RouteRiskResponse:
    """
    Score route risk using GPT-4o-mini.

    Combines destination coordinates, time of day, day of week,
    NCRB crime context, and nearby safe zones into a risk assessment.
    Latency target: < 2 seconds.
    """
    # Fetch nearby safe zones in parallel with LLM call preparation
    safe_zones = await _fetch_nearby_safe_zones(
        request.destination_lat, request.destination_lng
    )

    safe_zones_text = ""
    if safe_zones:
        safe_zones_text = "\nNearby safe zones found:\n"
        for zone in safe_zones:
            safe_zones_text += f"  - {zone.name} ({zone.type}) at ({zone.lat}, {zone.lng})\n"

    user_message = f"""Assess the safety risk for a woman traveling to this destination:

Destination: ({request.destination_lat}, {request.destination_lng})
Time of day: {request.time_of_day}
Day of week: {request.day_of_week or 'Unknown'}

{NCRB_CRIME_CONTEXT}
{safe_zones_text}

Return your assessment as JSON."""

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content
        result = json.loads(result_text)

        return RouteRiskResponse(
            risk_score=max(1, min(5, int(result.get("risk_score", 3)))),
            risk_label=result.get("risk_label", "Moderate"),
            reasoning=result.get("reasoning", "Unable to assess risk."),
            safe_alternative=result.get("safe_alternative", "Consider traveling with a companion."),
            nearby_safe_zones=safe_zones,
        )

    except Exception as e:
        # Fallback: time-based heuristic if LLM fails
        hour = int(request.time_of_day.split(":")[0])
        if 22 <= hour or hour < 5:
            fallback_score = 4
            fallback_label = "High"
        elif 18 <= hour < 22:
            fallback_score = 3
            fallback_label = "Moderate"
        else:
            fallback_score = 2
            fallback_label = "Low"

        return RouteRiskResponse(
            risk_score=fallback_score,
            risk_label=fallback_label,
            reasoning=f"AI assessment unavailable ({str(e)[:50]}). Score based on time-of-day heuristic.",
            safe_alternative="Travel with a companion and share your live location with a trusted contact.",
            nearby_safe_zones=safe_zones,
        )
