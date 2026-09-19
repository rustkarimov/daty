from django.test import TestCase
import json

from ..models import Master, CustomUser


class MasterRegistrationTest(TestCase):
    """Тесты регистрации мастера"""

    def setUp(self):
        self.register_url = '/api/mobile/register/'

    def test_master_can_register(self):
        """Мастер успешно регистрируется"""
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                'phone': '79991234567',
                'first_name': 'Иван',
                'password': 'testpass123'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

        self.assertEqual(CustomUser.objects.count(), 1)
        user = CustomUser.objects.first()
        self.assertEqual(user.phone, '79991234567')

        self.assertEqual(Master.objects.count(), 1)
        master = Master.objects.first()
        self.assertIsNotNone(master.encryption_key)

    def test_register_with_existing_phone_fails(self):
        """Нельзя зарегистрироваться с занятым телефоном"""
        CustomUser.objects.create_user(
            phone='79991234567',
            password='testpass123'
        )
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                'phone': '79991234567',
                'first_name': 'Пётр',
                'password': 'testpass456'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(CustomUser.objects.count(), 1)

    def test_register_without_phone_fails(self):
        """Нельзя зарегистрироваться без телефона"""
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                'phone': '',
                'first_name': 'Иван',
                'password': 'testpass123'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(CustomUser.objects.count(), 0)