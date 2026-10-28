from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from masters.models import Booking, Notification
from masters.utils.push_utils import send_push_to_master
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Отправляет напоминания о не подтвержденных записях (старше 4 часов)'

    def handle(self, *args, **options):
        threshold = timezone.now() - timedelta(hours=4)
        
        # Ищем записи, которые ждут подтверждения и созданы более 4 часов назад
        pending_bookings = Booking.objects.filter(
            status='pending',
            confirmed_by_master=False,
            created_at__lte=threshold,
        )
        
        count = 0
        for b in pending_bookings:
            # Проверяем, не отправляли ли мы уже напоминание по этой записи
            # Для этого ищем уведомление с типом "warning" и этой записью
            already_notified = Notification.objects.filter(
                master=b.master,
                type='warning',
                title='Ждет подтверждения',
                object_id=b.id
            ).exists()

            if already_notified:
                continue # Уже отправили, пропускаем
            
            # Создаем уведомление в БД
            Notification.objects.create(
                master=b.master,
                type='warning', # Используем тип "warning" для напоминаний
                title='Ждет подтверждения',
                message=f'Заявка от {b.client_name} на {b.date.strftime("%d.%m")} в {b.time.strftime("%H:%M")}',
                content_object=b
            )
            
            # Отправляем Push-уведомление
            try:
                send_push_to_master(
                    master=b.master,
                    title='⏳ Заявка ждет подтверждения',
                    body=f'{b.client_name} · {b.time.strftime("%H:%M")}',
                    url='/dashboard/',
                    tag=f'pending-{b.id}'
                )
            except Exception as e:
                logger.error(f"Ошибка отправки push для записи {b.id}: {e}")
                
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Отправлено напоминаний: {count}'))