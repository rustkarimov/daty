from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from .models import CustomUser, Master, Booking, Notification

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CustomUser)
def create_master_profile(sender, instance, created, **kwargs):
    """При создании CustomUser — автоматически создать Master."""
    if created:
        Master.objects.get_or_create(user=instance)
        logger.info(f"Создан профиль мастера для пользователя {instance.phone}")


@receiver(post_save, sender=CustomUser)
def save_master_profile(sender, instance, **kwargs):
    """При сохранении CustomUser — сохранить связанный Master."""
    if hasattr(instance, 'master'):
        instance.master.save()


@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    """
    Уведомления для одиночных записей от клиента.
    Для составных записей уведомление создаётся в create_multiple_bookings.
    """
    if not created:
        return
    
    # Если это часть составной записи — уведомление создаёт основная функция
    if "услуга" in instance.client_comment and "из" in instance.client_comment:
        return
    
    # Только для записей, созданных клиентом
    if instance.created_by == 'master' or instance.created_by == 'admin':
        return
    
    # Уведомления создаются в create_booking / create_multiple_bookings.
    # Этот сигнал — страховка на будущее.