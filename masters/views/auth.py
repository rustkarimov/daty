"""
Аутентификация: вход, регистрация, восстановление пароля, выход.
"""
import json
import random

from django.contrib.auth import login, authenticate
from django.contrib.auth import logout as auth_logout
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from ..models import CustomUser, Master, PhoneVerification
from ..utils.response_utils import api_success, api_error
from ..utils.sms_utils import send_sms
from ..utils.call_utils import request_call_verification, check_call_status


def mobile_login(request):
    """Вход по номеру телефона и паролю."""
    try:
        data = json.loads(request.body)
        phone = data.get('phone')
        password = data.get('password')
        
        if not phone or not password:
            return api_error('Введите телефон и пароль', status=400)
        
        user = authenticate(request, username=phone, password=password)
        if user:
            login(request, user)
            return api_success({'message': 'Вход выполнен'})
        return api_error('Неверный телефон или пароль', status=400)
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при входе', status=500)


def mobile_register(request):
    """Регистрация нового мастера по номеру телефона."""
    try:
        data = json.loads(request.body)
        phone = data.get('phone')
        first_name = data.get('first_name', '')
        password = data.get('password')
        
        if not phone or not password:
            return api_error('Введите телефон и пароль', status=400)
        
        if CustomUser.objects.filter(phone=phone).exists():
            return api_error('Пользователь с таким телефоном уже существует', status=409)
        
        # Сразу создаём пользователя
        user = CustomUser.objects.create_user(
            phone=phone,
            password=password,
            first_name=first_name,
        )
        Master.objects.create(
            user=user,
            phone=phone,
            first_name=first_name,
        )
        
        # Сразу логиним
        login(request, user)
        
        return api_success({'message': 'Регистрация завершена'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при регистрации', status=500)


def mobile_verify(request):
    """Подтверждение регистрации по коду из SMS."""
    try:
        data = json.loads(request.body)
        code = data.get('code')
        phone = request.session.get('reg_phone')
        
        if not phone:
            return api_error('Сессия истекла, начните регистрацию заново', status=400)
        
        verification = PhoneVerification.objects.filter(phone=phone, code=code, is_used=False).first()
        
        if verification:
            verification.is_used = True
            verification.save()
            
            user = CustomUser.objects.create_user(
                phone=phone,
                password=request.session.get('reg_password'),
                first_name=request.session.get('reg_first_name', ''),
            )
            Master.objects.create(
                user=user,
                phone=phone,
                first_name=request.session.get('reg_first_name', ''),
            )
            login(request, user)
            
            # Очищаем сессию
            for key in ['reg_phone', 'reg_first_name', 'reg_password']:
                request.session.pop(key, None)
            
            return api_success({'message': 'Регистрация завершена'})
        
        return api_error('Неверный код подтверждения', status=400)
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при подтверждении', status=500)


def mobile_resend_code(request):
    """Повторная отправка кода подтверждения."""
    try:
        data = json.loads(request.body)
        phone = data.get('phone') or request.session.get('reg_phone')
        
        if not phone:
            return api_error('Телефон не найден', status=400)
        
        import re
        phone_cleaned = re.sub(r'\D', '', phone)
        
        # Проверка rate limit (защита от спама и слива баланса SMS.ru)
        from ..utils.rate_limit import check_sms_limits
        allowed, error_msg = check_sms_limits(request, phone_cleaned)
        if not allowed:
            return api_error(error_msg, status=429)
        
        verification_code = str(random.randint(100000, 999999))
        PhoneVerification.objects.create(phone=phone_cleaned, code=verification_code)
        
        # Отправляем реальное SMS
        success, result = send_sms(phone_cleaned, verification_code)
        if not success:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"SMS не отправлено на {phone}: {result}")
        
        return api_success({'message': 'Код отправлен повторно'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Ошибка в mobile_resend_code: {e}")
        return api_error('Ошибка при отправке кода', status=500)


def request_reset_call(request):
    """Запрашивает звонок для восстановления пароля"""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        data = json.loads(request.body)
        phone = data.get('phone')
        
        if not phone:
            return api_error('Введите номер телефона', status=400)
        
        # Проверяем, есть ли пользователь с таким телефоном
        try:
            user = CustomUser.objects.get(phone=phone)
        except CustomUser.DoesNotExist:
            return api_error('Пользователь с таким номером не найден', status=404)
        
        # Запрашиваем звонок
        success, check_id, call_phone, call_phone_pretty, error = request_call_verification(phone)
        
        if not success:
            return api_error(error or 'Ошибка при запросе звонка', status=500)
        
        # Сохраняем check_id в сессии
        request.session['reset_check_id'] = check_id
        request.session['reset_phone'] = phone
        
        return api_success({
            'check_id': check_id,
            'call_phone': call_phone,
            'call_phone_pretty': call_phone_pretty,
            'message': f'Позвоните на номер {call_phone_pretty} для подтверждения'
        })
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при запросе звонка', status=500)


def check_reset_call_status(request):
    """Проверяет статус звонка"""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        check_id = request.session.get('reset_check_id')
        
        if not check_id:
            return api_error('Сессия истекла, начните восстановление заново', status=400)
        
        success, is_confirmed, status_text, error = check_call_status(check_id)
        
        if not success:
            return api_error(error or 'Ошибка проверки статуса', status=500)
        
        return api_success({
            'is_confirmed': is_confirmed,
            'status_text': status_text
        })
        
    except Exception as e:
        return api_error('Ошибка при проверке статуса', status=500)


def reset_password_confirm(request):
    """Подтверждает новый пароль после звонка"""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        data = json.loads(request.body)
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        if not new_password or not confirm_password:
            return api_error('Введите пароль дважды', status=400)
        
        if new_password != confirm_password:
            return api_error('Пароли не совпадают', status=400)
        
        if len(new_password) < 6:
            return api_error('Пароль должен содержать минимум 6 символов', status=400)
        
        # Проверяем статус звонка
        check_id = request.session.get('reset_check_id')
        phone = request.session.get('reset_phone')
        
        if not check_id or not phone:
            return api_error('Сессия истекла, начните восстановление заново', status=400)
        
        success, is_confirmed, status_text, error = check_call_status(check_id)
        
        if not success:
            return api_error(error or 'Ошибка проверки статуса', status=500)
        
        if not is_confirmed:
            return api_error('Звонок ещё не подтверждён. Позвоните по номеру.', status=400)
        
        # Меняем пароль
        user = CustomUser.objects.get(phone=phone)
        user.set_password(new_password)
        user.save()
        
        # Очищаем сессию
        request.session.pop('reset_check_id', None)
        request.session.pop('reset_phone', None)
        
        return api_success({'message': 'Пароль успешно изменён'})
        
    except CustomUser.DoesNotExist:
        return api_error('Пользователь не найден', status=404)
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при смене пароля', status=500)


def logout_view(request):
    """Выход из аккаунта и редирект на главную."""
    auth_logout(request)
    return redirect('home')