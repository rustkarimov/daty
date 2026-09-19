from django.test import TestCase
from datetime import time

from ..models import Booking, Service
from .factories import (
    create_master,
    create_service,
    create_schedule,
    get_next_monday,
)


class BookingCancellationTest(TestCase):
    """Тесты удаления (отмены) записи"""

    def setUp(self):
        self.master = create_master()
        self.service = create_service(self.master)
        self.test_date = get_next_monday()

        self.booking = Booking.objects.create(
            master=self.master,
            service=self.service,
            client_name='Мария',
            encrypted_phone=b'fake',
            date=self.test_date,
            time=time(10, 0),
            status='confirmed'
        )

        self.client.force_login(self.master.user)
        self.delete_url = f'/api/booking/{self.booking.id}/delete/'

    def test_master_can_delete_booking(self):
        """Мастер успешно удаляет запись"""
        response = self.client.post(self.delete_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Booking.objects.count(), 0)

    def test_delete_nonexistent_booking_fails(self):
        """Нельзя удалить несуществующую запись"""
        response = self.client.post('/api/booking/99999/delete/')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Booking.objects.count(), 1)

    def test_anonymous_cannot_delete_booking(self):
        """Анонимный пользователь не может удалить запись"""
        self.client.logout()
        response = self.client.post(self.delete_url)
        self.assertEqual(Booking.objects.count(), 1)