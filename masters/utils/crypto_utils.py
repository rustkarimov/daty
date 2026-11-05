"""
Утилиты для шифрования/расшифровки персональных данных.

Единая точка входа для всех операций с телефонами клиентов.
Убирает копипаст try/except InvalidToken по всему проекту.
"""
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