from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Получить IP клиента с учётом прокси."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def check_rate_limit(key, max_attempts, timeout_seconds):
    """
    Проверяет и увеличивает счётчик попыток.
    
    Returns:
        (bool, int): (разрешено?, сколько попыток осталось)
    """
    count = cache.get(key, 0)
    
    if count >= max_attempts:
        return False, 0
    
    cache.set(key, count + 1, timeout_seconds)
    return True, max_attempts - count - 1


def check_call_limits(request, phone):
    """
    Проверяет все лимиты для запроса звонка.
    
    Returns:
        (bool, str): (разрешено?, сообщение об ошибке)
    """
    ip = get_client_ip(request)
    
    # 1. Лимит на номер: 3 в час
    key_phone = f"call_phone:{phone}"
    allowed, remaining = check_rate_limit(key_phone, max_attempts=3, timeout_seconds=3600)
    if not allowed:
        logger.warning(f"Rate limit: телефон {phone} превысил лимит звонков (IP: {ip})")
        return False, "Слишком много запросов на этот номер. Попробуйте через час."
    
    # 2. Лимит на IP: 10 в час
    key_ip = f"call_ip:{ip}"
    allowed, remaining = check_rate_limit(key_ip, max_attempts=10, timeout_seconds=3600)
    if not allowed:
        logger.warning(f"Rate limit: IP {ip} превысил лимит звонков")
        return False, "Слишком много запросов. Попробуйте позже."
    
    # 3. Глобальный лимит: 200 в сутки
    key_global = "call_global"
    allowed, remaining = check_rate_limit(key_global, max_attempts=200, timeout_seconds=86400)
    if not allowed:
        logger.error(f"Rate limit: глобальный лимит звонков исчерпан!")
        return False, "Сервис временно перегружен. Попробуйте позже."
    
    return True, ""


def check_sms_limits(request, phone):
    """
    Проверяет все лимиты для отправки SMS.
    
    Returns:
        (bool, str): (разрешено?, сообщение об ошибке)
    """
    ip = get_client_ip(request)
    
    # 1. Лимит на номер: 3 в час
    key_phone = f"sms_phone:{phone}"
    allowed, remaining = check_rate_limit(key_phone, max_attempts=3, timeout_seconds=3600)
    if not allowed:
        logger.warning(f"Rate limit: телефон {phone} превысил лимит SMS (IP: {ip})")
        return False, "Слишком много запросов на этот номер. Попробуйте через час."
    
    # 2. Лимит на IP: 10 в час
    key_ip = f"sms_ip:{ip}"
    allowed, remaining = check_rate_limit(key_ip, max_attempts=10, timeout_seconds=3600)
    if not allowed:
        logger.warning(f"Rate limit: IP {ip} превысил лимит SMS")
        return False, "Слишком много запросов. Попробуйте позже."
    
    # 3. Глобальный лимит: 200 в сутки
    key_global = "sms_global"
    allowed, remaining = check_rate_limit(key_global, max_attempts=200, timeout_seconds=86400)
    if not allowed:
        logger.error(f"Rate limit: глобальный лимит SMS исчерпан!")
        return False, "Сервис временно перегружен. Попробуйте позже."
    
    return True, ""