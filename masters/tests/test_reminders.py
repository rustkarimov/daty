"""
Тесты для management-команды send_pending_reminders.

Проверяем, что после USE_TZ=True команда корректно находит pending-записи
старше 4 часов и создаёт уведомления (без дублей).
"""
from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from ..models import Booking, Notification
from .factories import (
    create_master,
    create_service,
    create_schedule,
    get_next_monday,
)


class SendPendingRemindersTest(TestCase):
    """Тесты команды send_pending_reminders."""

    def setUp(self):
        self.master = create_master()
        self.master.work_mode = 'home'
        self.master.save()
        self.service = create_service(self.master)
        create_schedule(self.master)
        self.test_date = get_next_monday()

    def _make_pending_booking(self, hours_ago):
        """
        Создаёт pending-запись, у которой created_at = now - hours_ago.

        Обходим auto_now_add через update() после создания.
        """
        from datetime import time
        booking = Booking.objects.create(
            master=self.master,
            service=self.service,
            client_name='Мария',
            encrypted_phone=b'fake',
            date=self.test_date,
            time=time(10, 0),
            status='pending',
            confirmed_by_master=False,
        )
        fake_created_at = timezone.now() - timedelta(hours=hours_ago)
        Booking.objects.filter(pk=booking.pk).update(created_at=fake_created_at)
        booking.refresh_from_db()
        return booking

    def _run_command(self):
        """
        Запускает команду. Push-утилита упадёт с FileNotFoundError
        (нет VAPID-ключа) — но команда ловит Exception и логирует.
        Поэтому просто вызываем и смотрим на БД.
        """
        out = StringIO()
        call_command('send_pending_reminders', stdout=out)
        return out.getvalue()

    # ---------- Тесты ----------

    def test_creates_notification_for_old_pending_booking(self):
        """Pending-запись старше 4 часов → создаётся уведомление."""
        booking = self._make_pending_booking(hours_ago=5)

        self._run_command()

        notifications = Notification.objects.filter(
            master=self.master,
            type='warning',
            title='Ждет подтверждения',
        )
        self.assertEqual(
            notifications.count(), 1,
            "Должно быть создано ровно одно уведомление"
        )
        notif = notifications.first()
        self.assertEqual(notif.object_id, booking.id)
        self.assertIn('Мария', notif.message)

    def test_skips_fresh_pending_booking(self):
        """Pending-запись младше 4 часов → уведомление не создаётся."""
        self._make_pending_booking(hours_ago=1)

        self._run_command()

        self.assertEqual(
            Notification.objects.filter(
                type='warning', title='Ждет подтверждения'
            ).count(),
            0,
            "Свежая pending-запись (< 4 часов) не должна триггерить уведомление"
        )

    def test_no_duplicate_on_second_run(self):
        """Повторный запуск не создаёт дубликат уведомления."""
        self._make_pending_booking(hours_ago=5)

        self._run_command()
        self._run_command()

        self.assertEqual(
            Notification.objects.filter(
                type='warning', title='Ждет подтверждения'
            ).count(),
            1,
            "Должно быть одно уведомление, без дублей"
        )

    def test_skips_confirmed_booking(self):
        """Подтверждённая запись старше 4 часов → не триггерит уведомление."""
        from datetime import time
        booking = Booking.objects.create(
            master=self.master,
            service=self.service,
            client_name='Пётр',
            encrypted_phone=b'fake',
            date=self.test_date,
            time=time(10, 0),
            status='pending',
            confirmed_by_master=True,   # ← подтверждена
        )
        fake_created_at = timezone.now() - timedelta(hours=5)
        Booking.objects.filter(pk=booking.pk).update(created_at=fake_created_at)

        self._run_command()

        self.assertEqual(
            Notification.objects.filter(
                type='warning', title='Ждет подтверждения'
            ).count(),
            0,
            "Подтверждённая запись не должна триггерить напоминание"
        )