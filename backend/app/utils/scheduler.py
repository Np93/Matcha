from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.profile.profile_service import reset_fame_ratings
from app.user.user_service import mark_users_offline_if_needed, cleanup_unverified_accounts, cleanup_expired_reset_codes


scheduler = AsyncIOScheduler()

def start_scheduler():
    # Reset du fame rating tous les jours à minuit
    scheduler.add_job(
        reset_fame_ratings,
        CronTrigger(hour=0, minute=0),
        name="Reset fame rating every day at midnight",
        replace_existing=True,
    )

    # Vérification des utilisateurs inactifs toutes les 5 minutes
    scheduler.add_job(
        mark_users_offline_if_needed,
        CronTrigger(minute="*/5"),  # Toutes les 30 minutes (mettre 30, 5 pour debug)
        name="Mark users offline if inactive for 30min",
        replace_existing=True,
    )

    scheduler.add_job(
        cleanup_unverified_accounts,
        CronTrigger(minute="*/10"),  # Toutes les 10 minutes
        name="Delete unconfirmed accounts after 10 minutes",
        replace_existing=True,
    )

    scheduler.add_job(
        cleanup_expired_reset_codes,
        CronTrigger(minute="*/10"),  # Toutes les 10 minutes
        name="Delete password reset after 10 min",
        replace_existing=True,
    )
    scheduler.start()
    # print("✅ Tâches planifiées activées (APS)")