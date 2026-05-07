"""
SafeGuard AI Engine — Configuration & Threshold Constants
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ---- OpenAI ----
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = "gpt-4o-mini"

# ---- Supabase ----
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# ---- Alert Thresholds (Module 1 — Women) ----
M1_AUDIO_THRESHOLD = float(os.getenv("M1_AUDIO_THRESHOLD", "0.70"))
M1_MOTION_G_THRESHOLD = float(os.getenv("M1_MOTION_G_THRESHOLD", "2.5"))
M1_CONFIRM_WINDOW_SEC = int(os.getenv("M1_CONFIRM_WINDOW_SEC", "10"))
M1_ETA_OVERDUE_MIN = 5

# ---- Alert Thresholds (Module 2 — Child) ----
M2_AUDIO_THRESHOLD = float(os.getenv("M2_AUDIO_THRESHOLD", "0.55"))
M2_MOTION_G_THRESHOLD = float(os.getenv("M2_MOTION_G_THRESHOLD", "2.0"))
M2_CONFIRM_WINDOW_SEC = int(os.getenv("M2_CONFIRM_WINDOW_SEC", "5"))
M2_ETA_OVERDUE_MIN = 3

# ---- Threat Fusion Weights ----
WEIGHT_AUDIO = 0.40
WEIGHT_MOTION = 0.25
WEIGHT_ETA = 0.20
WEIGHT_ZONE_EXIT = 0.15

# ---- Time Penalty ----
NIGHT_START_HOUR = 22  # 10pm
NIGHT_END_HOUR = 5     # 5am
NIGHT_PENALTY = 15     # +15 points during night hours

# ---- Module 1 Score Bands ----
M1_MONITOR_MAX = 40
M1_PING_MAX = 70
# Score > 70 = auto SOS

# ---- Module 2 Score Bands (lower thresholds) ----
M2_MONITOR_MAX = 30
M2_PING_MAX = 55
# Score > 55 = auto SOS

# ---- DBSCAN Heatmap ----
DBSCAN_EPS = 0.005          # ~500m at Indian latitudes
DBSCAN_MIN_SAMPLES = 3
HEATMAP_DAYS_LOOKBACK = 30

# ---- Behaviour Tracker ----
ZSCORE_FLAG_THRESHOLD = 2.0
BASELINE_WEEKS = 4

# ---- Grooming Classifier ----
GROOMING_ALERT_MIN_FLAGS = 3  # Require 3+ flag types before alerting parent

# ---- Scheduler Cron ----
DIGEST_CRON_HOUR = 8
DIGEST_CRON_DAY_OF_WEEK = "mon"
HEATMAP_CRON_HOUR = 2

# ---- Google Places ----
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
