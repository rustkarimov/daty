from django.test import TestCase
from datetime import date, time, timedelta
from cryptography.fernet import Fernet
import json

from ..models import Booking, Service, BlacklistedClient
from .factories import (
    create_master,
    create_service,
    create_schedule,
    get_next_monday,
    get_past_date,
)


class ClientBookingTest(TestCase):
    """Тесты сценария 'Клиент записывается к мастеру'"""

    def setUp(self):
        self.master = create_master()
        self.service = create_service(self.master)
        create_schedule(self.master)
        self.test_date = get_next_monday()
        self.booking_url = f'/api/{self.master.public_slug}/book/'

    def test_client_can_create_booking(self):
        """Клиент успешно записывается к мастеру"""
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария Петрова',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '10:00',
                'comment': 'Первый раз',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(Booking.objects.count(), 1)

        booking = Booking.objects.first()
        self.assertEqual(booking.client_name, 'Мария Петрова')
        self.assertEqual(booking.date, self.test_date)
        self.assertEqual(booking.time, time(10, 0))

    def test_client_phone_is_encrypted(self):
        """Телефон клиента зашифрован в БД"""
        self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '10:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        booking = Booking.objects.first()
        self.assertIsInstance(booking.encrypted_phone, bytes)
        self.assertNotIn(b'79991112233', bytes(booking.encrypted_phone))

        key = self.master.get_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
        self.assertEqual(decrypted, '79991112233')

    def test_booking_with_invalid_phone_fails(self):
        """Запись не создаётся при неверном телефоне"""
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '123',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '10:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Booking.objects.count(), 0)

    def test_booking_on_busy_time_fails(self):
        """Нельзя записаться на занятое время"""
        Booking.objects.create(
            master=self.master,
            service=self.service,
            client_name='Клиент 1',
            encrypted_phone=b'fake',
            date=self.test_date,
            time=time(10, 0),
            status='confirmed'
        )
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '10:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Booking.objects.count(), 1)

    def test_blacklisted_client_cannot_book(self):
        """Клиент в ЧС не может записаться"""
        BlacklistedClient.objects.create(
            master=self.master,
            phone='79991112233',
            reason='Не пришёл'
        )
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '10:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Booking.objects.count(), 0)

    def test_booking_in_past_fails(self):
        """Нельзя записаться на прошедшую дату"""
        past_date = get_past_date(1)
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': past_date.strftime('%Y-%m-%d'),
                'time': '10:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Booking.objects.count(), 0)

    def test_booking_outside_working_hours_fails(self):
        """Нельзя записаться вне рабочего времени"""
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '07:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Booking.objects.count(), 0)

    def test_booking_with_invalid_service_fails(self):
        """Нельзя записаться на несуществующую услугу"""
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': 99999,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '10:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Booking.objects.count(), 0)

    def test_master_can_create_booking(self):
        """Мастер может создать запись вручную"""
        response = self.client.post(
            self.booking_url,
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария Петрова',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '11:00',
                'comment': 'Записал по телефону',
                'created_by': 'master'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        booking = Booking.objects.first()
        self.assertEqual(booking.created_by, 'master')

    def test_client_can_book_multiple_services(self):
        """Клиент может записаться на несколько услуг подряд"""
        service2 = create_service(self.master, name='Педикюр', price=2000)
        multiple_url = f'/api/{self.master.public_slug}/book-multiple/'
        response = self.client.post(
            multiple_url,
            data=json.dumps({
                'services': [self.service.id, service2.id],
                'client_name': 'Мария Петрова',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'start_time': '10:00',
                'comment': '',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])