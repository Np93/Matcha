from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.profile.profile_service import reset_fame_ratings
from app.user.user_service import mark_users_offline_if_needed, cleanup_unverified_accounts


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
        CronTrigger(minute="*/5"),  # Toutes les 5 minutes
        name="Mark users offline if inactive for 30min",
        replace_existing=True,
    )

    scheduler.add_job(
        cleanup_unverified_accounts,
        CronTrigger(minute="*/10"),  # Toutes les 10 minutes
        name="Supprimer les comptes non confirmés apres 5 min",
        replace_existing=True,
    )
    scheduler.start()
    # print("✅ Tâches planifiées activées (APS)")