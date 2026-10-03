"""
API для клиентов: авторизация по звонку, просмотр/изменение/отмена записей.
"""
import json
import re
import secrets
from datetime import datetime, date

from django.shortcuts import render, redirect, get_object_or_404
from django.http import Http404
from django.views.decorators.csrf import csrf_exempt
from cryptography.fernet import Fernet, InvalidToken

from ..models import Booking, ClientSession, Notification
from ..utils.response_utils import api_success, api_error
from ..utils.schedule_utils import ScheduleCalculator
from ..utils.master_utils import get_master_by_identifier
from ..utils.call_utils import request_call_verification, check_call_status


# ============================================================
# ПРОСМОТР ЗАПИСИ ПО ТОКЕНУ
# ============================================================

def client_booking_view(request, identifier, token):
    """
    Страница клиента для просмотра/изменения/отмены записи.
    Открывается по ссылке из push/SMS: /booking/<token>/
    """
    booking = get_object_or_404(Booking, token=token, status='confirmed')
    
    # Расшифровываем телефон для отображения (частично)
    key = booking.master.get_encryption_key()
    phone = ''
    if key:
        try:
            f = Fernet(key)
            phone = f.decrypt(bytes(booking.encrypted_phone)).decode()
        except (InvalidToken, Exception):
            try:
                phone = booking.encrypted_phone.decode('utf-8')
            except:
                phone = ''
    
    phone_cleaned = re.sub(r'\D', '', phone)
    phone_display = f"+7 *** *** {phone_cleaned[-4:]}" if len(phone_cleaned) == 11 else phone
    
    context = {
        'booking': booking,
        'master': booking.master,
        'phone_display': phone_display,
        'token': token,
        'identifier': identifier,
        'today': date.today(),
    }
    
    return render(request, 'masters/public/booking_client.html', context)


def api_client_get_booking(request, identifier, token):
    """API: возвращает данные записи и доступные даты для изменения."""
    try:
        booking = Booking.objects.get(token=token, status='confirmed')
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    
    calculator = ScheduleCalculator(booking.master)
    
    # Получаем доступные даты
    dates = calculator.get_available_dates(
        days_ahead=60,
        min_service_duration=booking.service.duration
    )
    
    def get_month_ru(d):
        months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
        return months[d.month - 1]
    
    def get_weekday_ru(d):
        weekdays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
        return weekdays[d.weekday()]
    
    dates_data = [{
        'date': d.strftime('%Y-%m-%d'),
        'display': f"{d.day} {get_month_ru(d)}",
        'day_of_week': get_weekday_ru(d),
    } for d in dates[:30]]
    
    return api_success({
        'booking': {
            'id': booking.id,
            'date': booking.date.strftime('%Y-%m-%d'),
            'time': booking.time.strftime('%H:%M'),
            'service_name': booking.service.name,
            'service_duration': booking.service.duration,
            'service_price': float(booking.service.price),
            'client_name': booking.client_name,
            'master_name': booking.master.first_name or 'Мастер',
        },
        'available_dates': dates_data,
    })


@csrf_exempt
def api_client_get_slots(request, identifier, token):
    """API: возвращает доступные слоты для изменения записи."""
    try:
        booking = Booking.objects.get(token=token, status='confirmed')
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    
    date_str = request.GET.get('date')
    if not date_str:
        return api_error('Дата не указана', status=400)
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return api_error('Неверный формат даты', status=400)
    
    calculator = ScheduleCalculator(booking.master)
    
    current_time = None
    if target_date == date.today():
        current_time = datetime.now().time()
    
    slots = calculator.generate_time_slots(
        target_date,
        booking.service.duration,
        exclude_booking_id=booking.id,
        current_time=current_time,
        original_booking_id=booking.id
    )
    
    return api_success({'slots': slots})


# ============================================================
# ИЗМЕНЕНИЕ И ОТМЕНА ЗАПИСИ
# ============================================================

@csrf_exempt
def api_client_cancel_booking(request, identifier, token):
    """API: отменяет запись клиентом (с проверкой, что запись не прошла)."""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        booking = Booking.objects.get(token=token, status='confirmed')
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    
    # Проверка: запись уже прошла
    if booking.date < date.today():
        return api_error('Запись уже прошла, отменить её нельзя', status=400)
    
    # Проверка: запись сегодня, но время уже прошло
    if booking.date == date.today():
        if booking.time < datetime.now().time():
            return api_error('Время записи уже прошло, отменить её нельзя', status=400)
    
    # Меняем статус
    booking.status = 'cancelled'
    booking.save()

    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Клиент {booking.client_name} отменил запись #{booking.id} у мастера {booking.master.id}")
    
    # Уведомление мастеру
    Notification.objects.create(
        master=booking.master,
        type='cancelled_booking',
        title=f'{booking.client_name}',
        message=f"📅 {booking.date.strftime('%d.%m.%Y')}\n⏰ {booking.time.strftime('%H:%M')} - {booking.service.name}",
        content_object=booking
    )
    
    # Push мастеру
    from ..utils.push_utils import send_push_to_master
    try:
        send_push_to_master(
            master=booking.master,
            title='❌ Отмена записи',
            body=f'{booking.client_name} · {booking.time.strftime("%H:%M")} · {booking.service.name}',
            url='/dashboard/',
            tag=f'booking-{booking.id}'
        )
    except Exception as e:
        logger.error(f"Ошибка push при отмене записи #{booking.id}: {e}")
    
    return api_success({'message': 'Запись отменена'})


@csrf_exempt
def api_client_update_booking(request, identifier, token):
    """API: изменяет запись клиентом (с проверкой, что запись не прошла)."""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        booking = Booking.objects.get(token=token, status='confirmed')
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    
    # Проверка: запись уже прошла
    if booking.date < date.today():
        return api_error('Запись уже прошла, перенести её нельзя', status=400)
    
    # Проверка: запись сегодня, но время уже прошло
    if booking.date == date.today():
        if booking.time < datetime.now().time():
            return api_error('Время записи уже прошло, перенести её нельзя', status=400)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    
    date_str = data.get('date')
    time_str = data.get('time')
    
    if not date_str or not time_str:
        return api_error('Укажите дату и время', status=400)
    
    try:
        new_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        new_time = datetime.strptime(time_str, '%H:%M').time()
    except ValueError:
        return api_error('Неверный формат даты/времени', status=400)
    
    # Проверяем доступность
    calculator = ScheduleCalculator(booking.master)
    
    slots = calculator.generate_time_slots(
        new_date,
        booking.service.duration,
        exclude_booking_id=booking.id,
        original_booking_id=booking.id
    )
    
    is_available = any(slot['start'] == time_str for slot in slots)
    if not is_available:
        return api_error('Это время уже занято. Выберите другое.', status=409)
    
    # Сохраняем старые значения
    old_date = booking.date
    old_time = booking.time
    
    # Обновляем
    booking.date = new_date
    booking.time = new_time
    booking.save()

    import logging
    logger = logging.getLogger(__name__)
    logger.info(
        f"Клиент {booking.client_name} перенёс запись #{booking.id} "
        f"с {old_date} {old_time} на {new_date} {new_time}"
    )
    
    # Уведомление мастеру
    Notification.objects.create(
        master=booking.master,
        type='changed_booking',
        title=f'{booking.client_name}',
        message=f"📅 Стало: {new_date.strftime('%d.%m.%Y')} {new_time.strftime('%H:%M')}\n⏰ {booking.service.name}\n📅 Было: {old_date.strftime('%d.%m.%Y')} {old_time.strftime('%H:%M')}",
        content_object=booking
    )
    
    # Push мастеру
    from ..utils.push_utils import send_push_to_master
    try:
        send_push_to_master(
            master=booking.master,
            title='✏️ Изменение записи',
            body=f'{booking.client_name} · было {old_time.strftime("%H:%M")} → стало {new_time.strftime("%H:%M")}',
            url='/dashboard/',
            tag=f'booking-{booking.id}'
        )
    except Exception as e:
        logger.error(f"Ошибка push при изменении записи #{booking.id}: {e}")
    
    return api_success({'message': 'Запись изменена'})


# ============================================================
# АВТОРИЗАЦИЯ ПО ЗВОНКУ
# ============================================================

@csrf_exempt
def api_client_check_phone(request, identifier):
    """API: проверяет, есть ли записи у клиента с указанным телефоном."""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return api_error('Мастер не найден', status=404)
    
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '')
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    
    phone_cleaned = re.sub(r'\D', '', phone)
    if len(phone_cleaned) != 11:
        return api_error('Введите корректный номер телефона (11 цифр)', status=400)
    
    # Ищем записи с таким телефоном
    key = master.get_encryption_key()
    
    has_bookings = False
    if key:
        f = Fernet(key)
        bookings = Booking.objects.filter(master=master, status='confirmed')
        for b in bookings:
            try:
                b_phone = f.decrypt(bytes(b.encrypted_phone)).decode()
                if re.sub(r'\D', '', b_phone) == phone_cleaned:
                    has_bookings = True
                    break
            except:
                pass
    
    if not has_bookings:
        return api_error('Записи с таким номером не найдены', status=404)
    
    return api_success({'phone': phone_cleaned})


@csrf_exempt
def api_client_request_call(request, identifier):
    """API: запрашивает звонок для подтверждения клиента."""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return api_error('Мастер не найден', status=404)
    
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '')
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    
    phone_cleaned = re.sub(r'\D', '', phone)
    
    # Проверка rate limit (защита от спама и слива баланса SMS.ru)
    from ..utils.rate_limit import check_call_limits
    allowed, error_msg = check_call_limits(request, phone_cleaned)
    if not allowed:
        return api_error(error_msg, status=429)
    
    # Запрашиваем звонок через SMS.ru
    success, check_id, call_phone, call_phone_pretty, error = request_call_verification(phone_cleaned)
    
    if not success:
        return api_error(error or 'Ошибка запроса звонка', status=500)
    
    # Создаём сессию (неподтверждённую)
    ClientSession.objects.create(
        master=master,
        phone=phone_cleaned,
        check_id=check_id,
        call_phone=call_phone,
        is_confirmed=False,
    )
    
    return api_success({
        'check_id': check_id,
        'call_phone': call_phone,
        'call_phone_pretty': call_phone_pretty,
    })


@csrf_exempt
def api_client_check_call(request, identifier):
    """API: проверяет статус звонка; если подтверждён — генерирует session_key."""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return api_error('Мастер не найден', status=404)
    
    try:
        data = json.loads(request.body)
        check_id = data.get('check_id', '')
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    
    session = ClientSession.objects.filter(
        master=master, check_id=check_id
    ).first()
    
    if not session:
        return api_error('Проверка не найдена', status=404)
    
    # Проверяем статус звонка
    success, is_confirmed, status_text, error = check_call_status(check_id)
    
    if not success:
        return api_error(error or 'Ошибка проверки', status=500)
    
    if not is_confirmed:
        return api_success({'is_confirmed': False})
    
    # Подтверждён! Генерируем session_key
    session_key = secrets.token_urlsafe(32)
    
    session.is_confirmed = True
    session.session_key = session_key
    session.save()
    
    # Сохраняем в Django-сессию
    request.session['client_phone'] = session.phone
    request.session['client_master_id'] = master.id
    
    return api_success({
        'is_confirmed': True,
        'redirect': f'/{identifier}/my-bookings/',
    })


# ============================================================
# МОИ ЗАПИСИ (СТРАНИЦА КЛИЕНТА)
# ============================================================

def my_bookings_view(request, identifier):
    """Страница «Мои записи» — для клиента (только будущие)."""
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return api_error('Мастер не найден', status=404)
    
    client_phone = request.session.get('client_phone')
    client_master_id = request.session.get('client_master_id')
    
    if not client_phone or client_master_id != master.id:
        return redirect(f'/{identifier}/')
    
    # Находим все записи клиента
    key = master.get_encryption_key()
    
    bookings = []
    if key:
        f = Fernet(key)
        
        # Фильтруем только будущие записи (сегодня и позже)
        today = date.today()
        all_bookings = Booking.objects.filter(
            master=master,
            status='confirmed',
            date__gte=today  # ← фильтр на уровне БД
        ).order_by('date', 'time')
        
        for b in all_bookings:
            try:
                b_phone = f.decrypt(bytes(b.encrypted_phone)).decode()
                if re.sub(r'\D', '', b_phone) == client_phone:
                    bookings.append(b)
            except:
                pass
    
    return render(request, 'masters/public/my_bookings.html', {
        'master': master,
        'identifier': identifier,
        'bookings': bookings,
        'client_phone': client_phone,
    })