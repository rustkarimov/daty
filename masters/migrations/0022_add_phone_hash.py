"""
Добавляет phone_hash в Booking и CancelledBooking.

1. Схема: поле phone_hash (CharField(64), null, db_index).
2. Data: заполняет phone_hash для существующих записей.

Для заполнения:
- расшифровываем телефон через Fernet (или fallback),
- нормализуем (только цифры),
- HMAC-SHA256 с master.encryption_key.
"""
from django.db import migrations, models
import hashlib
import hmac
import re

from cryptography.fernet import Fernet, InvalidToken


def _normalize_phone(phone):
    return re.sub(r'\D', '', phone or '')


def _decrypt_phone(encrypted_phone, key):
    """Fallback-расшифровка (как в crypto_utils)."""
    if not encrypted_phone:
        return ''
    if key:
        try:
            f = Fernet(bytes(key))
            return f.decrypt(bytes(encrypted_phone)).decode()
        except (InvalidToken, Exception):
            pass
    try:
        return encrypted_phone.decode('utf-8')
    except Exception:
        pass
    try:
        return str(encrypted_phone)
    except Exception:
        return ''


def _compute_hash(phone, key):
    phone_cleaned = _normalize_phone(phone)
    if not phone_cleaned or not key:
        return None
    key_bytes = key.encode() if isinstance(key, str) else bytes(key)
    return hmac.new(key_bytes, phone_cleaned.encode(), hashlib.sha256).hexdigest()


def fill_phone_hash(apps, schema_editor):
    """Заполняет phone_hash для существующих Booking и CancelledBooking."""
    Booking = apps.get_model('masters', 'Booking')
    CancelledBooking = apps.get_model('masters', 'CancelledBooking')
    Master = apps.get_model('masters', 'Master')

    # Кеш ключей по master_id
    keys = {m.id: m.encryption_key for m in Master.objects.all()}

    def process(model):
        # Только записи без хеша
        qs = model.objects.filter(phone_hash__isnull=True)
        for obj in qs.iterator():
            key = keys.get(obj.master_id)
            if not key:
                continue
            phone = _decrypt_phone(obj.encrypted_phone, key)
            h = _compute_hash(phone, key)
            if h:
                model.objects.filter(pk=obj.pk).update(phone_hash=h)

    process(Booking)
    process(CancelledBooking)


def reverse_fill(apps, schema_editor):
    """Откат: обнулить phone_hash."""
    Booking = apps.get_model('masters', 'Booking')
    CancelledBooking = apps.get_model('masters', 'CancelledBooking')
    Booking.objects.update(phone_hash=None)
    CancelledBooking.objects.update(phone_hash=None)


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0021_convert_naive_to_utc'),
    ]

    operations = [
        # Схема: добавляем поле
        migrations.AddField(
            model_name='booking',
            name='phone_hash',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='HMAC-SHA256 от нормализованного телефона. Для быстрого поиска записей клиента.',
                max_length=64,
                null=True,
                verbose_name='Хеш телефона (для поиска)',
            ),
        ),
        migrations.AddField(
            model_name='cancelledbooking',
            name='phone_hash',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='HMAC-SHA256 от нормализованного телефона. Для быстрого поиска записей клиента.',
                max_length=64,
                null=True,
                verbose_name='Хеш телефона (для поиска)',
            ),
        ),
        # Data: заполняем для существующих записей
        migrations.RunPython(fill_phone_hash, reverse_fill),
    ]