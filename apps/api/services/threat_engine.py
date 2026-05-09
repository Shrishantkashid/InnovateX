from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ThreatFusionEngine:
    def __init__(self):
        # Thresholds from PRD 6.4 and 7.5
        self.m1_thresholds = {
            "audio": 0.70,
            "motion": 2.5,
            "eta": 5, # minutes
        }
        self.m2_thresholds = {
            "audio": 0.55,
            "motion": 2.0,
            "eta": 3, # minutes
        }

    def calculate_threat_score(self, module: str, signals: list) -> int:
        """
        Signals is a list of dicts: {"type": "audio"|"motion"|"eta"|"zone_exit", "value": float}
        """
        score = 0
        thresholds = self.m1_thresholds if module == "m1" else self.m2_thresholds

        for signal in signals:
            sig_type = signal.get("type")
            value = signal.get("value", 0)

            if sig_type == "audio":
                if value >= thresholds["audio"]:
                    score += 40
            elif sig_type == "motion":
                if value >= thresholds["motion"]:
                    score += 30
            elif sig_type == "eta":
                if value >= thresholds["eta"]:
                    score += 20
            elif sig_type == "zone_exit" and module == "m2":
                score += 50 # Instant high score for child zone exit

        # Time of day weight: 10pm–5am = +15 pts (PRD 6.4)
        now = datetime.now().time()
        if now.hour >= 22 or now.hour < 5:
            score += 15

        # Cap at 100
        return min(score, 100)

    def determine_action(self, score: int) -> str:
        if score >= 70:
            return "auto_sos"
        elif score >= 40:
            return "ping_user"
        return "monitor"

threat_engine = ThreatFusionEngine()
