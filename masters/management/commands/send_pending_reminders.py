from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from masters.models import Booking, Notification, Master
from masters.utils.push_utils import send_push_to_master
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Отправляет напоминания о не подтвержденных записях (старше 4 часов)'

    def handle(self, *args, **options):
        # Напоминания — только для мастеров, у которых включено.
        # Порог — свой у каждого мастера.
        now = timezone.now()
        count = 0

        masters = Master.objects.filter(pending_reminder_enabled=True)

        for master in masters:
            hours = master.pending_reminder_hours or 4
            threshold = now - timedelta(hours=hours)

            pending_bookings = Booking.objects.filter(
                master=master,
                status='pending',
                confirmed_by_master=False,
                created_at__lte=threshold,
            )

            for b in pending_bookings:
                # Проверяем, не отправляли ли мы уже напоминание по этой записи
                already_notified = Notification.objects.filter(
                    master=b.master,
                    type='warning',
                    title='Ждет подтверждения',
                    object_id=b.id,
                ).exists()

                if already_notified:
                    continue

                # Создаём уведомление в БД
                Notification.objects.create(
                    master=b.master,
                    type='warning',
                    title='Ждет подтверждения',
                    message=(
                        f'Заявка от {b.client_name} на '
                        f'{b.date.strftime("%d.%m")} в {b.time.strftime("%H:%M")}'
                    ),
                    content_object=b,
                )

                # Отправляем Push
                try:
                    send_push_to_master(
                        master=b.master,
                        title='⏳ Заявка ждет подтверждения',
                        body=f'{b.client_name} · {b.time.strftime("%H:%M")}',
                        url='/dashboard/',
                        tag=f'pending-{b.id}',
                    )
                except Exception as e:
                    logger.error(f"Ошибка отправки push для записи {b.id}: {e}")

                count += 1

        self.stdout.write(self.style.SUCCESS(f'Отправлено напоминаний: {count}'))