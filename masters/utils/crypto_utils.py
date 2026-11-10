"""
Утилиты для шифрования/расшифровки персональных данных.
"""
import hashlib
import hmac
import logging
import re

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)


def decrypt_phone(encrypted_phone, key):
    """
    Расшифровывает телефон. Возвращает строку.
    Никогда не бросает исключение — при полной неудаче возвращает ''.

    Уровни fallback:
    1. Fernet-расшифровка (нормальный путь)
    2. Прямой decode UTF-8 (старые записи до шифрования)
    3. str() (совсем аварийный случай)
    """
    if not encrypted_phone:
        return ''

    # Уровень 1: Fernet
    if key:
        try:
            f = Fernet(key)
            return f.decrypt(bytes(encrypted_phone)).decode()
        except (InvalidToken, Exception) as e:
            logger.warning(f"Не удалось расшифровать телефон через Fernet: {e}")

    # Уровень 2: прямой UTF-8
    try:
        return encrypted_phone.decode('utf-8')
    except Exception:
        pass

    # Уровень 3: аварийный
    try:
        return str(encrypted_phone)
    except Exception:
        return ''


def encrypt_phone(phone, key):
    """
    Шифрует телефон. Возвращает bytes.
    Если key нет — возвращает UTF-8 bytes (fallback).
    """
    phone_cleaned = phone or ''
    if key:
        try:
            f = Fernet(key)
            return f.encrypt(phone_cleaned.encode())
        except Exception as e:
            logger.error(f"Не удалось зашифровать телефон: {e}")

    return phone_cleaned.encode()


def decrypt_phone_normalized(encrypted_phone, key):
    """
    Расшифровывает телефон и нормализует (только цифры).
    Удобно для сравнения телефонов.
    """
    raw = decrypt_phone(encrypted_phone, key)
    return re.sub(r'\D', '', raw)


def normalize_phone(phone):
    """Оставляет только цифры."""
    return re.sub(r'\D', '', phone or '')


def format_phone(phone_cleaned):
    """
    Форматирует 11-значный номер в 'X XXX XXX-XX-XX'.
    Если номер не 11-значный — возвращает как есть.
    """
    if not phone_cleaned or len(phone_cleaned) != 11:
        return phone_cleaned or ''
    return (
        f"{phone_cleaned[0]} {phone_cleaned[1:4]} "
        f"{phone_cleaned[4:7]}-{phone_cleaned[7:9]}-{phone_cleaned[9:11]}"
    )


def compute_phone_hash(phone, key):
    """
    Детерминированный HMAC-SHA256 от нормализованного телефона.

    :param phone: телефон (строка, может быть с форматированием)
    :param key: секретный ключ мастера (bytes). Обычно master.encryption_key.
    :return: hex-строка (64 символа) или None, если phone пустой.

    Используется для быстрого поиска записей клиента:
    одинаковый телефон у одного мастера → одинаковый хеш.
    У разных мастеров (разные ключи) → разные хеши.
    Без ключа восстановить телефон нельзя (HMAC).
    """
    phone_cleaned = normalize_phone(phone)
    if not phone_cleaned:
        return None
    if not key:
        logger.warning("compute_phone_hash: key не задан, возвращаю None")
        return None

    # key может быть bytes (BinaryField) или str — приводим к bytes
    if isinstance(key, str):
        key_bytes = key.encode()
    else:
        key_bytes = bytes(key)

    return hmac.new(
        key_bytes,
        phone_cleaned.encode(),
        hashlib.sha256,
    ).hexdigest()