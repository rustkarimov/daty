from django.test import TestCase
from datetime import date, time, timedelta
import json
from cryptography.fernet import Fernet

from ..models import Booking, Notification, CancelledBooking, BlacklistedClient
from ..utils.schedule_utils import ScheduleCalculator
from .factories import create_master, create_service, create_schedule, get_next_monday

class BookingSignalsTest(TestCase):
    """Тесты сигналов и уведомлений"""
    
    def setUp(self):
        self.master = create_master()
        self.master.work_mode = 'home'
        self.master.save()
        self.service = create_service(self.master)
        create_schedule(self.master)  
        self.test_date = get_next_monday()

    def test_notification_created_on_booking(self):
        """При создании записи создается уведомление для мастера"""
        # Берем первый доступный слот из генератора
        from ..utils.schedule_utils import ScheduleCalculator
        calc = ScheduleCalculator(self.master)
        slots = calc.generate_time_slots(self.test_date, self.service.duration)
        
        self.assertTrue(len(slots) > 0, "Слоты не сгенерировались!")
        available_time = slots[0]['start']

        # Делаем запрос на этот слот
        response = self.client.post(
            f'/api/{self.master.public_slug}/book/',
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': available_time,
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200, f"Ошибка API: {response.json()}")
        
        # Проверяем уведомление
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.master, self.master)
        self.assertIn('Мария', notif.title)
        
        # Проверяем, что уведомление создалось
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.master, self.master)
        self.assertIn('Мария', notif.title)


class BlacklistLogicTest(TestCase):
    """Тесты логики черного списка"""
    
    def setUp(self):
        self.master = create_master()
        self.service = create_service(self.master)
        self.test_date = get_next_monday()
        self.client.force_login(self.master.user)
        
        # Создаем запись клиента
        self.booking = Booking.objects.create(
            master=self.master, service=self.service,
            client_name='Мария', encrypted_phone=b'fake',
            date=self.test_date, time=time(10, 0),
            status='confirmed'
        )

    def test_blacklist_cancels_future_bookings(self):
        """Добавление в ЧС отменяет будущие записи и переносит в CancelledBooking"""
        phone_cleaned = '79991112233'
        # Шифруем телефон, чтобы он совпал
        key = self.master.get_encryption_key()
        f = Fernet(key)
        enc_phone = f.encrypt(phone_cleaned.encode())
        
        self.booking.encrypted_phone = enc_phone
        self.booking.save()

        # Вызываем API добавления в ЧС
        response = self.client.post(
            '/api/blacklist/add/',
            data=json.dumps({'phone': phone_cleaned, 'name': 'Мария', 'reason': 'Не пришла'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        # Проверяем, что запись удалена из будущих
        self.assertEqual(Booking.objects.count(), 0)
        
        # И перенесена в архив отмененных
        self.assertEqual(CancelledBooking.objects.count(), 1)
        cancelled = CancelledBooking.objects.first()
        self.assertEqual(cancelled.client_name, 'Мария')
        self.assertEqual(cancelled.cancelled_by, 'blacklist')


class MultipleBookingsTest(TestCase):
    """Тесты составной записи (несколько услуг подряд)"""
    
    def setUp(self):
        self.master = create_master()
        self.service1 = create_service(self.master, name='Маникюр', duration=60)
        self.service2 = create_service(self.master, name='Педикюр', duration=30)
        create_schedule(self.master)
        self.test_date = get_next_monday()

    def test_multiple_bookings_created_sequentially(self):
        """Две записи создаются подряд (без наложений)"""
        response = self.client.post(
            f'/api/{self.master.public_slug}/book-multiple/',
            data=json.dumps({
                'services': [self.service1.id, self.service2.id],
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'start_time': '10:00',
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        self.assertEqual(Booking.objects.count(), 2)
        b1 = Booking.objects.get(service=self.service1)
        b2 = Booking.objects.get(service=self.service2)
        
        self.assertEqual(b1.time, time(10, 0))
        self.assertEqual(b2.time, time(11, 0)) # Начинается ровно когда закончился первый

class BookingWorkingHoursTest(TestCase):
    """Тесты проверки рабочих часов"""
    
    def setUp(self):
        self.master = create_master()
        self.service = create_service(self.master)
        create_schedule(self.master, start=time(9,0), end=time(18,0))
        self.test_date = get_next_monday()

    def test_cannot_book_after_working_hours(self):
        """Нельзя записаться после 18:00"""
        response = self.client.post(
            f'/api/{self.master.public_slug}/book/',
            data=json.dumps({
                'service_id': self.service.id,
                'client_name': 'Мария',
                'client_phone': '79991112233',
                'date': self.test_date.strftime('%Y-%m-%d'),
                'time': '17:30', # Услуга 60 мин, не влезет до 18:00
                'created_by': 'client'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Booking.objects.count(), 0)