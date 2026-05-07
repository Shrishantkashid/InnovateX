"""
SafeGuard AI Engine — APScheduler Cron Jobs
Manages nightly heatmap clustering and weekly digest generation.
"""

import asyncio
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from config import DIGEST_CRON_HOUR, DIGEST_CRON_DAY_OF_WEEK, HEATMAP_CRON_HOUR

logger = logging.getLogger(__name__)


# ---- Job Functions ----

async def run_heatmap_clustering():
    """
    Nightly job: Run DBSCAN clustering on last 30 days of SOS incidents.
    Results are cached/stored for the authority dashboard.
    """
    from heatmap_cluster import cluster_incidents, IncidentPoint

    logger.info("[CRON] Starting nightly heatmap clustering...")

    try:
        # In production, fetch from Supabase:
        # SELECT lat, lng, threat_score, created_at FROM sos_events
        # WHERE created_at > now() - interval '30 days'
        #
        # For hackathon, this would be called by the API layer with real data.
        # Here we define the job structure.

        # Placeholder: API layer should call this with actual incident data
        # incidents = await fetch_incidents_from_supabase()
        # result = cluster_incidents(incidents)
        # await store_clusters_to_supabase(result)

        logger.info("[CRON] Heatmap clustering completed.")

    except Exception as e:
        logger.error(f"[CRON] Heatmap clustering failed: {e}")


async def run_weekly_digest():
    """
    Weekly job (Monday 8am): Generate digest for all active parent-child pairs.
    """
    from digest_generator import generate_weekly_digest, DigestInput

    logger.info("[CRON] Starting weekly digest generation...")

    try:
        # In production, fetch all active child-parent pairs from Supabase:
        # SELECT child_id, parent_id FROM users
        # WHERE role = 'child' AND module = 'm3'
        #
        # For each pair:
        # 1. Aggregate week's contact_risk_scores
        # 2. Aggregate behaviour anomalies
        # 3. Aggregate content flags
        # 4. Call generate_weekly_digest()
        # 5. Store result in weekly_digests table
        # 6. Send push notification to parent

        logger.info("[CRON] Weekly digest generation completed.")

    except Exception as e:
        logger.error(f"[CRON] Weekly digest generation failed: {e}")


async def run_daily_contact_risk_scoring():
    """
    Daily job: Re-score all contacts with active grooming flags.
    Ensures scores stay current even without new on-device data.
    """
    logger.info("[CRON] Starting daily contact risk scoring...")

    try:
        # In production:
        # 1. Fetch all contact_risk_scores where risk_category in ('moderate', 'high', 'critical')
        # 2. Re-evaluate with latest behaviour data
        # 3. Update scores and notify parent if escalation occurs

        logger.info("[CRON] Daily contact risk scoring completed.")

    except Exception as e:
        logger.error(f"[CRON] Daily contact risk scoring failed: {e}")


# ---- Scheduler Setup ----

def create_scheduler() -> AsyncIOScheduler:
    """
    Create and configure the APScheduler instance with all cron jobs.

    Schedule:
        - Heatmap clustering: 2am daily
        - Weekly digest: 8am every Monday
        - Daily contact risk scoring: 3am daily
    """
    scheduler = AsyncIOScheduler()

    # Nightly heatmap clustering (2am daily)
    scheduler.add_job(
        run_heatmap_clustering,
        trigger=CronTrigger(hour=HEATMAP_CRON_HOUR, minute=0),
        id="heatmap_clustering",
        name="Nightly DBSCAN Heatmap Clustering",
        replace_existing=True,
    )

    # Weekly digest generation (Monday 8am)
    scheduler.add_job(
        run_weekly_digest,
        trigger=CronTrigger(
            day_of_week=DIGEST_CRON_DAY_OF_WEEK,
            hour=DIGEST_CRON_HOUR,
            minute=0,
        ),
        id="weekly_digest",
        name="Weekly Parent Digest Generation",
        replace_existing=True,
    )

    # Daily contact risk re-scoring (3am daily)
    scheduler.add_job(
        run_daily_contact_risk_scoring,
        trigger=CronTrigger(hour=3, minute=0),
        id="daily_contact_scoring",
        name="Daily Contact Risk Re-scoring",
        replace_existing=True,
    )

    return scheduler


def start_scheduler():
    """Start the scheduler (call from main app startup)."""
    scheduler = create_scheduler()
    scheduler.start()
    logger.info(
        f"[SCHEDULER] Started with jobs: "
        f"heatmap@{HEATMAP_CRON_HOUR}:00 daily, "
        f"digest@{DIGEST_CRON_HOUR}:00 {DIGEST_CRON_DAY_OF_WEEK}, "
        f"contact_scoring@03:00 daily"
    )
    return scheduler
