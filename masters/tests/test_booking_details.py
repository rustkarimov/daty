"""
Тесты для API get_booking_details.

Фиксируют текущее поведение перед рефакторингом:
структура ответа, статистика клиента, форматирование телефона.
"""
import json
from datetime import time

from django.test import TestCase
from cryptography.fernet import Fernet

from ..models import Booking
from .factories import (
    create_master,
    create_service,
    create_schedule,
    get_next_monday,
)


class BookingDetailsAPITest(TestCase):
    """Тесты эндпоинта /api/booking/<id>/details/."""

    def setUp(self):
        self.master = create_master()
        self.master.work_mode = 'home'
        self.master.save()
        self.service = create_service(self.master, name='Маникюр', duration=60)
        create_schedule(self.master)
        self.test_date = get_next_monday()

        self.client.force_login(self.master.user)

        # Шифруем телефон клиента (как в проде)
        key = self.master.get_encryption_key()
        f = Fernet(key)
        self.encrypted_phone = f.encrypt(b'79991112233')

        # Основная запись (на которую смотрим детали)
        self.booking = Booking.objects.create(
            master=self.master,
            service=self.service,
            client_name='Мария Петрова',
            encrypted_phone=self.encrypted_phone,
            date=self.test_date,
            time=time(10, 0),
            status='confirmed',
            confirmed_by_master=True,
            client_comment='Первый раз',
        )

        # Вторая запись того же клиента (для статистики)
        self.booking2 = Booking.objects.create(
            master=self.master,
            service=self.service,
            client_name='Мария Петрова',
            encrypted_phone=self.encrypted_phone,
            date=self.test_date,
            time=time(12, 0),
            status='confirmed',
            confirmed_by_master=True,
        )

        self.url = f'/api/booking/{self.booking.id}/details/'

    def test_returns_success_and_basic_fields(self):
        """Ответ содержит success=True и базовые поля клиента/записи."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        self.assertEqual(data['booking_id'], self.booking.id)
        self.assertEqual(data['client_name'], 'Мария Петрова')
        self.assertEqual(data['client_phone'], '79991112233')
        self.assertEqual(data['client_phone_formatted'], '7 999 111-22-33')
        self.assertEqual(data['comment'], 'Первый раз')
        self.assertEqual(data['status'], 'Подтверждена')
        self.assertEqual(data['status_raw'], 'confirmed')

    def test_returns_services(self):
        """Ответ содержит текущую услугу."""
        response = self.client.get(self.url)
        data = response.json()

        self.assertEqual(data['total_services'], 1)
        self.assertEqual(data['total_duration'], 60)
        self.assertEqual(len(data['services']), 1)
        self.assertEqual(data['services'][0]['name'], 'Маникюр')
        self.assertEqual(data['services'][0]['duration'], 60)

    def test_returns_client_stats(self):
        """Ответ содержит статистику по клиенту: 2 визита."""
        response = self.client.get(self.url)
        data = response.json()

        stats = data['client_stats']
        self.assertEqual(stats['total_visits'], 2)
        self.assertEqual(len(stats['visits']), 2)
        # first_visit / last_visit — обе даты test_date (одинаковые)
        self.assertNotEqual(stats['first_visit'], '—')
        self.assertNotEqual(stats['last_visit'], '—')

    def test_does_not_leak_other_clients(self):
        """Статистика не включает записи других клиентов."""
        # Создаём другого клиента
        key = self.master.get_encryption_key()
        f = Fernet(key)
        other_phone = f.encrypt(b'79992223344')

        Booking.objects.create(
            master=self.master,
            service=self.service,
            client_name='Пётр',
            encrypted_phone=other_phone,
            date=self.test_date,
            time=time(14, 0),
            status='confirmed',
            confirmed_by_master=True,
        )

        response = self.client.get(self.url)
        data = response.json()

        self.assertEqual(data['client_stats']['total_visits'], 2)
        self.assertEqual(data['client_name'], 'Мария Петрова')

    def test_not_found_for_other_master(self):
        """Чужая запись недоступна — 404."""
        # Создаём другого мастера и его запись
        other_master = create_master(phone='79995556677', first_name='Иван')
        other_service = create_service(other_master, name='Услуга', duration=30)
        other_booking = Booking.objects.create(
            master=other_master,
            service=other_service,
            client_name='Чужой',
            encrypted_phone=b'fake',
            date=self.test_date,
            time=time(10, 0),
            status='confirmed',
        )

        response = self.client.get(f'/api/booking/{other_booking.id}/details/')
        # get_object_or_404 → 404
        self.assertEqual(response.status_code, 404)