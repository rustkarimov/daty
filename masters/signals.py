from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
import logging

from .models import Master, Booking, Notification

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_master_profile(sender, instance, created, **kwargs):
    if created:
        Master.objects.get_or_create(user=instance)
        logger.info(f"Создан профиль мастера для пользователя {instance.phone}")


@receiver(post_save, sender=User)
def save_master_profile(sender, instance, **kwargs):
    if hasattr(instance, 'master'):
        instance.master.save()


@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    # Уведомления только для новых записей
    if not created:
        return
    
    # Если это часть составной записи — уведомление создаст основная функция
    if "услуга" in instance.client_comment and "из" in instance.client_comment:
        return
    
    # Уведомления только если запись создана клиентом
    if instance.created_by == 'master' or instance.created_by == 'admin':
        return
    
    # Здесь можно создать Notification для одиночных записей от клиента,
    # но сейчас логика уведомлений вынесена в create_multiple_bookings
    # и create_booking. Этот сигнал — «страховка» на будущее.