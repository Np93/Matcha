from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.profile.profile_service import reset_fame_ratings


scheduler = AsyncIOScheduler()

def start_scheduler():
    # Déclenche tous les jours à minuit
    scheduler.add_job(
        reset_fame_ratings,
        CronTrigger(hour=0, minute=0),
        name="Reset fame rating every day at midnight",
        replace_existing=True,
    )
    scheduler.start()
    # print("✅ Tâches planifiées activées (APS)")