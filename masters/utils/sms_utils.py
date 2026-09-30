import requests
import os
import logging

logger = logging.getLogger(__name__)


def send_sms(phone, code):
    """Отправляет SMS с кодом подтверждения через SMS.ru"""
    api_key = os.getenv('SMS_API_KEY')
    sender = os.getenv('SMS_SENDER', 'DATY')
    
    phone_cleaned = phone.replace('+', '').replace(' ', '').replace('-', '')
    
    url = "https://sms.ru/sms/send"
    params = {
        'api_id': api_key,
        'to': phone_cleaned,
        'msg': f'Код подтверждения: {code}',
        'json': 1,
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        
        if result.get('status_code') == 100:
            logger.info(f"SMS отправлено на {phone}")
            return True, result
        else:
            logger.error(f"Ошибка отправки SMS на {phone}: {result}")
            return False, result
    except Exception as e:
        logger.error(f"Исключение при отправке SMS на {phone}: {e}")
        return False, {'error': str(e)}