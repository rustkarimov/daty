import requests
import os
import logging

logger = logging.getLogger(__name__)


def request_call_verification(phone):
    """
    Запрашивает у SMS.ru номер для звонка
    Возвращает: (success, check_id, call_phone, call_phone_pretty, error)
    """
    api_id = os.getenv('SMS_API_KEY')
    
    if not api_id:
        logger.error("SMS_API_KEY не найден в окружении")
        return False, None, None, None, "API ключ не найден"
    
    phone_cleaned = phone.replace('+', '').replace(' ', '').replace('-', '')
    
    url = "https://sms.ru/callcheck/add"
    params = {
        'api_id': api_id,
        'phone': phone_cleaned,
        'json': 1
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        
        if result.get('status') == 'OK' and result.get('status_code') == 100:
            logger.info(f"Запрошен звонок для {phone}")
            return True, result.get('check_id'), result.get('call_phone'), result.get('call_phone_pretty'), None
        else:
            logger.warning(f"SMS.ru отклонил запрос звонка для {phone}: {result.get('status_text')}")
            return False, None, None, None, result.get('status_text', 'Ошибка API')
            
    except Exception as e:
        logger.error(f"Исключение при запросе звонка для {phone}: {e}")
        return False, None, None, None, str(e)


def check_call_status(check_id):
    """
    Проверяет статус звонка
    Возвращает: (success, is_confirmed, status_text, error)
    """
    api_id = os.getenv('SMS_API_KEY')
    
    if not api_id:
        logger.error("SMS_API_KEY не найден в окружении")
        return False, False, None, "API ключ не найден"
    
    url = "https://sms.ru/callcheck/status"
    params = {
        'api_id': api_id,
        'check_id': check_id,
        'json': 1
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        
        if result.get('status') == 'OK' and result.get('status_code') == 100:
            check_status = result.get('check_status')
            status_text = result.get('check_status_text', '')
            is_confirmed = (str(check_status) == '401')
            
            logger.debug(f"Статус звонка {check_id}: {check_status} (подтверждён: {is_confirmed})")
            
            return True, is_confirmed, status_text, None
        else:
            logger.warning(f"SMS.ru вернул ошибку при проверке звонка {check_id}: {result.get('status_text')}")
            return False, False, None, result.get('status_text', 'Ошибка API')
            
    except Exception as e:
        logger.error(f"Исключение при проверке звонка {check_id}: {e}")
        return False, False, None, str(e)