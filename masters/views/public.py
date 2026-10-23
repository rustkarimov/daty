"""
Публичные страницы и API мастера (для клиентов).
"""
import json
import re
from datetime import datetime, date, timedelta

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, Http404
from cryptography.fernet import Fernet

from ..models import Master, Service, Booking, BlacklistedClient
from ..utils.schedule_utils import ScheduleCalculator
from ..utils.response_utils import api_success, api_error
from ..utils.master_utils import get_master_by_identifier


# ============================================================
# ДОСТУПНЫЕ ДАТЫ И СЛОТЫ (ПУБЛИЧНЫЕ)
# ============================================================

def get_available_dates(request, identifier):
    """API: возвращает доступные даты для записи к мастеру."""
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return JsonResponse({'error': 'Мастер не найден'}, status=404)

    service_id = request.GET.get('service_id')
    total_duration = request.GET.get('total_duration')
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 30))

    duration = None

    if total_duration:
        duration = int(total_duration)
    elif service_id:
        try:
            service = Service.objects.get(id=service_id, master=master)
            duration = service.duration
        except Service.DoesNotExist:
            return JsonResponse({'error': 'Услуга не найдена'}, status=404)
    else:
        return JsonResponse({'error': 'Выберите услугу или укажите общую длительность'}, status=400)

    try:
        calculator = ScheduleCalculator(master)
        all_dates = calculator.get_available_dates(
            days_ahead=180,
            min_service_duration=duration
        )

        total = len(all_dates)
        start = (page - 1) * limit
        end = start + limit
        dates_page = all_dates[start:end]
        has_more = end < total

        dates_list = [{
            'date': d.strftime('%Y-%m-%d'),
            'display': f"{d.day} {_get_month_ru(d)}",
            'day_of_week': _get_weekday_ru(d)
        } for d in dates_page]

        return JsonResponse({
            'dates': dates_list,
            'mode': master.work_mode,
            'total': total,
            'page': page,
            'limit': limit,
            'has_more': has_more
        })

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f"Ошибка в get_available_dates: {e}")
        return JsonResponse({'error': str(e)}, status=500)


def get_available_slots(request, identifier):
    """API: возвращает свободные слоты мастера на конкретную дату."""
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return JsonResponse({'error': 'Мастер не найден'}, status=404)

    service_id = request.GET.get('service_id')
    total_duration = request.GET.get('total_duration')
    date_str = request.GET.get('date')
    exclude_booking_id = request.GET.get('exclude_booking_id')
    original_booking_id = request.GET.get('original_booking_id')

    if not date_str:
        return JsonResponse({'error': 'Не указана дата'}, status=400)

    duration = None

    if total_duration:
        duration = int(total_duration)
    elif service_id:
        try:
            service = Service.objects.get(id=service_id, master=master)
            duration = service.duration
        except Service.DoesNotExist:
            return JsonResponse({'error': 'Услуга не найдена'}, status=404)
    else:
        return JsonResponse({'error': 'Не указана услуга или общая длительность'}, status=400)

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Неверный формат даты'}, status=400)

    try:
        calculator = ScheduleCalculator(master)
        current_time = None
        if target_date == date.today():
            current_time = datetime.now().time()

        slots = calculator.generate_time_slots(
            target_date,
            duration,
            exclude_booking_id=int(exclude_booking_id) if exclude_booking_id else None,
            current_time=current_time,
            original_booking_id=int(original_booking_id) if original_booking_id else None
        )

        # Полная длительность «занятости» для отображения
        if master.work_mode == 'away':
            W = master.arrival_window_minutes or 0
            travel_after = master.away_travel_time_after_default or 0
            travel_before = master.away_travel_time_before_default or 0
            full_duration = travel_before + W + duration + travel_after
        else:
            travel_before = 0
            full_duration = duration

        return JsonResponse({
            'slots': slots,
            'mode': master.work_mode,
            'full_duration': full_duration,
            'travel_time_before': travel_before,
        })

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f"Ошибка в get_available_slots: {e}")
        return JsonResponse({'error': str(e)}, status=500)

# ============================================================
# СОЗДАНИЕ ЗАПИСЕЙ (ПУБЛИЧНЫЕ)
# ============================================================

def create_booking(request, identifier):
    """API: создаёт одну запись клиентом."""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)

    try:
        try:
            master = get_master_by_identifier(identifier)
        except Http404:
            return api_error('Мастер не найден', status=404)

        data = json.loads(request.body)

        service_id = data.get('service_id')
        client_name = data.get('client_name')
        client_phone = data.get('client_phone')
        date_str = data.get('date')
        time_str = data.get('time')
        comment = data.get('comment', '')
        created_by = data.get('created_by', 'client')
        client_address = (data.get('client_address') or '').strip()

        travel_time_before = data.get('travel_time_before')
        travel_time_after = data.get('travel_time_after')
        duration_extra_minutes = data.get('duration_extra_minutes')

        is_away = master.work_mode == 'away'

        if is_away and not client_address:
            return api_error('Укажите адрес для выезда', status=400)

        if not all([service_id, client_name, client_phone, date_str, time_str]):
            return api_error('Заполните все поля', status=400)

        client_phone_cleaned = re.sub(r'\D', '', client_phone)
        if len(client_phone_cleaned) != 11:
            return api_error('Номер телефона должен содержать 11 цифр', status=400)
        if not client_phone_cleaned.startswith('7'):
            return api_error('Номер должен начинаться с 7', status=400)

        if BlacklistedClient.objects.filter(master=master, phone=client_phone_cleaned).exists():
            return api_error('Не получается записаться. Попробуйте позже.', status=403)

        try:
            service = Service.objects.get(id=service_id, master=master)
        except Service.DoesNotExist:
            return api_error('Услуга не найдена', status=404)

        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        booking_time = datetime.strptime(time_str, '%H:%M').time()

        if booking_date < date.today():
            return api_error('Нельзя записаться на прошедшую дату', status=400)

        calculator = ScheduleCalculator(master)
        slots = calculator.generate_time_slots(booking_date, service.duration)
        is_available = any(slot['start'] == time_str for slot in slots)

        if not is_available:
            return api_error('Это время уже занято. Выберите другое время.', status=409)

        key = master.get_encryption_key()
        if key:
            f = Fernet(key)
            encrypted_phone = f.encrypt(client_phone_cleaned.encode())
        else:
            encrypted_phone = client_phone_cleaned.encode()

        travel_before_default = (master.away_travel_time_before_default or 0) if is_away else 0
        travel_after_default = (master.away_travel_time_after_default or 0) if is_away else 0

        if created_by == 'master':
            booking_status = 'confirmed'
        elif is_away:
            booking_status = 'pending'
        else:
            booking_status = 'confirmed'

        # Если мастер задал — используем его. Иначе — default.
        if travel_time_before is not None and is_away:
            final_travel_before = int(travel_time_before)
        else:
            final_travel_before = travel_before_default

        if travel_time_after is not None and is_away:
            final_travel_after = int(travel_time_after)
        else:
            final_travel_after = travel_after_default

        final_extra_minutes = int(duration_extra_minutes) if duration_extra_minutes is not None else 0

        booking = Booking.objects.create(
            master=master,
            service=service,
            client_name=client_name,
            encrypted_phone=encrypted_phone,
            client_comment=comment,
            date=booking_date,
            time=booking_time,
            status=booking_status,
            created_by=created_by,
            confirmed_by_master=(created_by == 'master'),
            service_mode='away' if is_away else 'home',
            client_address=client_address if is_away else '',
            travel_time_before=final_travel_before,
            travel_time_after=final_travel_after,
            duration_extra_minutes=final_extra_minutes,
        )

        message = 'Предварительная запись оформлена. Ждите подтверждения мастера.' if is_away else 'Запись создана!'

        return api_success({
            'message': message,
            'status': 'pending' if is_away else 'confirmed',
            'is_away': is_away,
            'booking': {
                'id': booking.id,
                'date': booking.date.strftime('%d.%m.%Y'),
                'time': booking.time.strftime('%H:%M'),
                'service': service.name,
            }
        })

    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты или времени: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при создании записи', status=500)


def create_multiple_bookings(request, identifier):
    """API: создаёт несколько записей подряд (для составной записи)."""
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)

    try:
        try:
            master = get_master_by_identifier(identifier)
        except Http404:
            return api_error('Мастер не найден', status=404)

        data = json.loads(request.body)

        service_ids = data.get('services', [])
        client_name = data.get('client_name')
        client_phone = data.get('client_phone')
        date_str = data.get('date')
        start_time_str = data.get('start_time')
        comment = data.get('comment', '')
        created_by = data.get('created_by', 'client')
        client_address = (data.get('client_address') or '').strip()

        travel_time_before = data.get('travel_time_before')
        travel_time_after = data.get('travel_time_after')
        duration_extra_minutes = data.get('duration_extra_minutes')

        is_away = master.work_mode == 'away'

        if is_away and not client_address:
            return api_error('Укажите адрес для выезда', status=400)

        if not service_ids or not client_name or not client_phone or not date_str or not start_time_str:
            return api_error('Заполните все поля', status=400)

        client_phone_cleaned = re.sub(r'\D', '', client_phone)
        if len(client_phone_cleaned) != 11:
            return api_error('Номер телефона должен содержать 11 цифр', status=400)
        if not client_phone_cleaned.startswith('7'):
            return api_error('Номер должен начинаться с 7', status=400)

        if BlacklistedClient.objects.filter(master=master, phone=client_phone_cleaned).exists():
            if created_by == 'master':
                return api_error('Этот клиент находится в чёрном списке', status=403)
            else:
                return api_error('Не получается записаться. Попробуйте позже.', status=403)

        services = []
        total_duration = 0
        for sid in service_ids:
            try:
                service = Service.objects.get(id=sid, master=master)
                services.append(service)
                total_duration += service.duration
            except Service.DoesNotExist:
                return api_error(f'Услуга с ID {sid} не найдена', status=404)

        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        start_time = datetime.strptime(start_time_str, '%H:%M').time()

        if booking_date < date.today():
            return api_error('Нельзя записаться на прошедшую дату', status=400)

        calculator = ScheduleCalculator(master)
        slots = calculator.generate_time_slots(booking_date, total_duration)
        is_available = any(slot['start'] == start_time_str for slot in slots)

        if not is_available:
            return api_error('Это время уже занято. Выберите другое время.', status=409)

        key = master.get_encryption_key()
        if key:
            f = Fernet(key)
            encrypted_phone = f.encrypt(client_phone_cleaned.encode())
        else:
            encrypted_phone = client_phone_cleaned.encode()

        created_bookings = []
        time_offset = 0
        services_list = []

        travel_before_default = (master.away_travel_time_before_default or 0) if is_away else 0
        travel_after_default = (master.away_travel_time_after_default or 0) if is_away else 0

        extra_minutes = int(duration_extra_minutes) if duration_extra_minutes is not None else 0

        for i, service in enumerate(services):
            booking_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=time_offset)).time()

            if len(services) > 1:
                service_comment = f"{comment} (услуга {i+1} из {len(services)}: {service.name})"
            else:
                service_comment = comment

            # travel_before: только для первой услуги (если мастер задал — его, иначе default)
            if travel_time_before is not None and is_away and i == 0:
                travel_before = int(travel_time_before)
            else:
                travel_before = travel_before_default if (is_away and i == 0) else 0

            # travel_after: только для последней услуги
            if travel_time_after is not None and is_away and i == len(services) - 1:
                travel_after = int(travel_time_after)
            else:
                travel_after = travel_after_default if (is_away and i == len(services) - 1) else 0

            if created_by == 'master':
                booking_status = 'confirmed'
            elif is_away:
                booking_status = 'pending'
            else:
                booking_status = 'confirmed'

            booking = Booking.objects.create(
                master=master,
                service=service,
                client_name=client_name,
                encrypted_phone=encrypted_phone,
                client_comment=service_comment,
                date=booking_date,
                time=booking_time,
                status=booking_status,
                created_by=created_by,
                confirmed_by_master=(created_by == 'master'),
                service_mode='away' if is_away else 'home',
                client_address=client_address if is_away else '',
                travel_time_before=travel_before,
                travel_time_after=travel_after,
                duration_extra_minutes=extra_minutes,
            )
            created_bookings.append(booking)
            services_list.append(service.name)
            time_offset += service.duration

        end_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=total_duration)).strftime('%H:%M')

        if created_by == 'client':
            from ..models import Notification
            months_ru = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                         'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
            date_human = f"{booking_date.day} {months_ru[booking_date.month - 1]}"

            notification_lines = [date_human]

            if is_away:
                notification_lines.append(f"📍 {client_address}")

            time_offset = 0
            for i, service in enumerate(services):
                booking_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=time_offset)).strftime('%H:%M')
                service_name = service.name
                if service.category:
                    service_name = f"{service.category.name}: {service_name}"
                notification_lines.append(f"{booking_time} — {service_name}")
                time_offset += service.duration

            notification_message = "\n".join(notification_lines)

            Notification.objects.create(
                master=master,
                type='pending_booking' if is_away else 'new_booking',
                title=client_name,
                message=notification_message,
                content_object=booking
            )

            from ..utils.push_utils import send_push_to_master

            if len(services) == 1:
                service_text = services[0].name
            else:
                service_text = f'{len(services)} услуги'

            push_title = 'Выездная запись (ожидает)' if is_away else 'Новая запись'
            push_body = f'{client_name} · {start_time_str} · {service_text}'

            import logging
            logger = logging.getLogger(__name__)
            try:
                result = send_push_to_master(
                    master=master,
                    title=push_title,
                    body=push_body,
                    url='/dashboard/',
                    tag=f'booking-{created_bookings[0].id}'
                )
                logger.info(f"Push после создания записи #{created_bookings[0].id}: {result}")
            except Exception as e:
                logger.error(f"Ошибка отправки push после записи #{created_bookings[0].id}: {e}")

        if is_away:
            message = 'Предварительная запись оформлена. Ждите подтверждения мастера.'
        else:
            message = f'✅ Запись на {len(created_bookings)} услуг создана!'

        return api_success({
            'message': message,
            'status': 'pending' if is_away else 'confirmed',
            'is_away': is_away,
            'bookings': [{
                'id': b.id,
                'time': b.time.strftime('%H:%M'),
                'service': b.service.name
            } for b in created_bookings],
            'total_duration': total_duration,
            'start_time': start_time_str,
            'end_time': end_time
        })

    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты или времени: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при создании записи', status=500)


# ============================================================
# ПУБЛИЧНАЯ СТРАНИЦА МАСТЕРА
# ============================================================

def master_by_id(request, master_id):
    """Публичная страница мастера по ID."""
    master = get_object_or_404(Master, id=master_id)
    services = Service.objects.filter(master=master, is_active=True)

    return render(request, 'masters/public/master_page.html', {
        'master': master,
        'services': services
    })


def master_by_login(request, login):
    """Публичная страница мастера по логину."""
    master = get_object_or_404(Master, login=login)
    services = Service.objects.filter(master=master, is_active=True)

    return render(request, 'masters/public/master_page.html', {
        'master': master,
        'services': services
    })


# ============================================================
# ЛОКАЛЬНЫЕ УТИЛИТЫ
# ============================================================

def _get_weekday_ru(date_obj):
    """Возвращает название дня недели на русском."""
    weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    return weekdays[date_obj.weekday()]


def _get_month_ru(date_obj):
    """Возвращает название месяца на русском."""
    months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]
    return months[date_obj.month - 1]