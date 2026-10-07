"""
Дашборд мастера: календарь, ближайшие записи, детали, подтверждение.
"""
import re
import json
from datetime import datetime, date

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from cryptography.fernet import Fernet, InvalidToken

from ..models import Booking, Schedule, DayOff, ExtraWorkingDay, Master, Service, CustomUser
from ..utils.response_utils import api_success, api_error


# ============================================================
# ГЛАВНАЯ СТРАНИЦА ДАШБОРДА
# ============================================================

@login_required
def dashboard(request):
    """Главная страница личного кабинета мастера."""
    try:
        master = request.user.master
    except Master.DoesNotExist:
        master = Master.objects.create(user=request.user)
    
    total_bookings = Booking.objects.filter(master=master).count()
    upcoming_bookings = Booking.objects.filter(
        master=master, 
        status='confirmed'
    ).order_by('date', 'time')[:5]
    
    total_services = Service.objects.filter(master=master).count()
    
    # Добавляем количество уникальных клиентов
    key = master.get_encryption_key()
    
    unique_phones = set()
    bookings = Booking.objects.filter(master=master, status='confirmed')
    
    for booking in bookings:
        phone = ''
        if key:
            try:
                f = Fernet(key)
                decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
                phone = decrypted
            except (InvalidToken, Exception):
                try:
                    phone = booking.encrypted_phone.decode('utf-8')
                except:
                    phone = str(booking.encrypted_phone)
        else:
            try:
                phone = booking.encrypted_phone.decode('utf-8')
            except:
                phone = str(booking.encrypted_phone)
        
        phone_cleaned = re.sub(r'\D', '', phone)
        if phone_cleaned:
            unique_phones.add(phone_cleaned)
    
    total_clients = len(unique_phones)
    
    context = {
        'master': master,
        'total_bookings': total_bookings,
        'upcoming_bookings': upcoming_bookings,
        'total_services': total_services,
        'total_clients': total_clients,
    }
    return render(request, 'masters/dashboard.html', context)


# ============================================================
# КАЛЕНДАРЬ
# ============================================================

@login_required
def get_calendar_schedule(request):
    """API: возвращает расписание мастера для календаря (с учётом доп. дней)."""
    master = request.user.master
    
    # Получаем регулярное расписание
    schedules = Schedule.objects.filter(master=master)
    schedules_data = {}
    for schedule in schedules:
        schedules_data[schedule.day_of_week] = {
            'start': schedule.start_time.strftime('%H:%M'),
            'end': schedule.end_time.strftime('%H:%M'),
            'breaks': [{
                'start': b.start_time.strftime('%H:%M'),
                'end': b.end_time.strftime('%H:%M')
            } for b in schedule.breaks.all()]
        }
    
    # УБИРАЕМ ОГРАНИЧЕНИЕ date__gte — показываем ВСЕ выходные
    days_off = DayOff.objects.filter(master=master).values_list('date', flat=True)
    days_off_list = [d.strftime('%Y-%m-%d') for d in days_off]
    
    # УБИРАЕМ ОГРАНИЧЕНИЕ date__gte — показываем ВСЕ дополнительные дни
    extra_days = ExtraWorkingDay.objects.filter(master=master)
    extra_days_data = {}
    for day in extra_days:
        extra_days_data[day.date.strftime('%Y-%m-%d')] = {
            'start': day.start_time.strftime('%H:%M'),
            'end': day.end_time.strftime('%H:%M'),
            'breaks': [{
                'start': b.start_time.strftime('%H:%M'),
                'end': b.end_time.strftime('%H:%M')
            } for b in day.breaks.all()]
        }
    
    return JsonResponse({
        'schedules': schedules_data,
        'days_off': days_off_list,
        'extra_days': extra_days_data
    })


# ============================================================
# БЛИЖАЙШИЕ ЗАПИСИ
# ============================================================

@login_required
def get_bookings_api(request):
    """API: возвращает список ближайших записей с пагинацией."""
    master = request.user.master
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    offset = (page - 1) * limit
    
    now = datetime.now()
    today = date.today()
    current_time = now.time()
    
    # Получаем все подтверждённые записи от сегодняшней даты и позже
    bookings = Booking.objects.filter(
        master=master,
        status='confirmed',
        date__gte=today
    ).order_by('date', 'time').select_related('service', 'service__category')
    
    # Фильтруем: если запись на сегодня, но время уже прошло — исключаем
    filtered_bookings = []
    for booking in bookings:
        if booking.date == today and booking.time < current_time:
            continue
        filtered_bookings.append(booking)
    
    key = master.get_encryption_key()
    
    # Пагинация
    total = len(filtered_bookings)
    has_more = offset + limit < total
    bookings_page = filtered_bookings[offset:offset + limit]
    
    def get_month_name(month_num):
        months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ]
        return months[month_num - 1]
    
    def is_today(date_obj):
        return date_obj == today
    
    data = []
    for booking in bookings_page:
        if is_today(booking.date):
            date_display = f"{booking.date.day} {get_month_name(booking.date.month)} (сегодня)"
        else:
            date_display = f"{booking.date.day} {get_month_name(booking.date.month)}"
        
        # Расшифровываем телефон
        phone = ''
        if key:
            try:
                f = Fernet(key)
                decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
                phone = decrypted
            except (InvalidToken, Exception):
                try:
                    phone = booking.encrypted_phone.decode('utf-8')
                except:
                    phone = str(booking.encrypted_phone)
        else:
            try:
                phone = booking.encrypted_phone.decode('utf-8')
            except:
                phone = str(booking.encrypted_phone)
        
        phone_cleaned = re.sub(r'\D', '', phone)
        if len(phone_cleaned) == 11:
            formatted_phone = f"{phone_cleaned[0]} {phone_cleaned[1:4]} {phone_cleaned[4:7]}-{phone_cleaned[7:9]}-{phone_cleaned[9:11]}"
        else:
            formatted_phone = phone
        
        # Формируем название услуги с категорией
        service_name = booking.service.name
        if booking.service.category:
            service_name = f"{booking.service.category.name}: {service_name}"
        
        data.append({
            'id': booking.id,
            'date': date_display,
            'time': booking.time.strftime('%H:%M'),
            'client_name': booking.client_name,
            'service_name': service_name,
            'phone': formatted_phone,
            'confirmed_by_master': booking.confirmed_by_master,
        })
    
    return JsonResponse({
        'bookings': data,
        'total': total,
        'page': page,
        'has_more': has_more
    })


@login_required
def get_booking_details(request, booking_id):
    """API: возвращает подробную информацию о записи и клиенте."""
    try:
        booking = get_object_or_404(Booking, id=booking_id, master=request.user.master)
        master = request.user.master
        
        # Расшифровываем телефон
        key = master.get_encryption_key()
        
        phone = ''
        if key:
            try:
                f = Fernet(key)
                decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
                phone = decrypted
            except (InvalidToken, Exception) as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Ошибка расшифровки телефона (booking_id={booking.id}): {e}")
                try:
                    phone = booking.encrypted_phone.decode('utf-8')
                except:
                    phone = str(booking.encrypted_phone)
        else:
            try:
                phone = booking.encrypted_phone.decode('utf-8')
            except:
                phone = str(booking.encrypted_phone)
        
        phone_cleaned = re.sub(r'\D', '', phone)
        
        # Функция для форматирования телефона
        def format_phone_num(phone_num):
            if not phone_num or len(phone_num) != 11:
                return phone_num
            return f"{phone_num[0]} {phone_num[1:4]} {phone_num[4:7]}-{phone_num[7:9]}-{phone_num[9:11]}"
        
        # Получаем все записи этого клиента для статистики
        client_bookings = Booking.objects.filter(
            master=master,
            status='confirmed'
        ).select_related('service', 'service__category')
        
        # Группируем по этому телефону
        visits = []
        total_visits = 0
        first_visit = None
        last_visit = None
        
        for b in client_bookings:
            # Расшифровываем телефон каждой записи
            b_phone = ''
            if key:
                try:
                    f = Fernet(key)
                    b_phone = f.decrypt(bytes(b.encrypted_phone)).decode()
                except:
                    continue
            else:
                try:
                    b_phone = b.encrypted_phone.decode('utf-8')
                except:
                    continue
            
            if re.sub(r'\D', '', b_phone) == phone_cleaned:
                total_visits += 1
                if first_visit is None or b.date < first_visit:
                    first_visit = b.date
                if last_visit is None or b.date > last_visit:
                    last_visit = b.date
                visits.append({
                    'date': b.date.strftime('%d.%m.%Y'),
                    'time': b.time.strftime('%H:%M'),
                    'service': b.service.name,
                    'category': b.service.category.name if b.service.category else None,
                })
        
        # Сортируем визиты по дате (сначала новые)
        visits.sort(key=lambda x: x['date'], reverse=True)
        
        current_services = [{
            'booking_id': booking.id,
            'name': booking.service.name,
            'category_name': booking.service.category.name if booking.service.category else None,
            'time': booking.time.strftime('%H:%M'),
            'duration': booking.service.duration,
            'service_id': booking.service.id,
            'status': booking.status
        }]
        
        # Статус по-русски
        status_map = {
            'confirmed': 'Подтверждена',
            'cancelled': 'Отменена',
            'completed': 'Выполнена'
        }
        
        return JsonResponse({
            'success': True,
            'booking_id': booking.id,
            'client_name': booking.client_name,
            'client_phone': phone,
            'client_phone_formatted': format_phone_num(phone_cleaned),
            'date': booking.date.strftime('%d.%m.%Y'),
            'time': booking.time.strftime('%H:%M'),
            'services': current_services,
            'total_services': len(current_services),
            'total_duration': sum(s['duration'] for s in current_services),
            'comment': booking.client_comment or '',
            'status': status_map.get(booking.status, booking.status),
            'created_by': 'Мастер' if booking.created_by == 'master' else 'Клиент',
            'client_stats': {
                'total_visits': total_visits,
                'first_visit': first_visit.strftime('%d.%m.%Y') if first_visit else '—',
                'last_visit': last_visit.strftime('%d.%m.%Y') if last_visit else '—',
                'visits': visits[:10]
            },
            'all_booking_ids': [booking.id]
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f"Ошибка в get_booking_details: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def api_confirm_booking(request, booking_id):
    """API: подтверждает запись мастером."""
    try:
        booking = Booking.objects.get(id=booking_id, master=request.user.master)
        booking.confirmed_by_master = True
        booking.save()
        return api_success({'message': 'Запись подтверждена'})
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка подтверждения', status=500)


@login_required
@require_http_methods(["POST"])
def api_unconfirm_booking(request, booking_id):
    """API: снимает подтверждение записи мастером."""
    try:
        booking = Booking.objects.get(id=booking_id, master=request.user.master)
        booking.confirmed_by_master = False
        booking.save()
        return api_success({'message': 'Подтверждение снято'})
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка снятия подтверждения', status=500)


# ============================================================
# ЗАПИСИ ПО ДАТАМ
# ============================================================

@login_required
def get_bookings_counts(request):
    """API: возвращает количество записей по датам (для календаря)."""
    master = request.user.master
    bookings = Booking.objects.filter(master=master, status='confirmed')
    
    counts = {}
    for booking in bookings:
        date_str = booking.date.strftime('%Y-%m-%d')
        counts[date_str] = counts.get(date_str, 0) + 1
    
    return JsonResponse({'counts': counts})


@login_required
def get_bookings_by_date(request):
    """API: возвращает список записей на конкретную дату."""
    master = request.user.master
    date_str = request.GET.get('date')
    
    if not date_str:
        return JsonResponse({'error': 'Дата не указана'}, status=400)
    
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    bookings = Booking.objects.filter(
        master=master,
        date=target_date,
        status='confirmed'
    ).order_by('time').select_related('service')
    
    key = master.get_encryption_key()
    
    data = []
    for booking in bookings:
        # Расшифровываем телефон
        phone = ''
        if key:
            try:
                f = Fernet(key)
                decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
                phone = decrypted
            except (InvalidToken, Exception):
                try:
                    phone = booking.encrypted_phone.decode('utf-8')
                except:
                    phone = str(booking.encrypted_phone)
        else:
            try:
                phone = booking.encrypted_phone.decode('utf-8')
            except:
                phone = str(booking.encrypted_phone)
        
        # Форматируем телефон
        phone_cleaned = re.sub(r'\D', '', phone)
        if len(phone_cleaned) == 11:
            formatted_phone = f"{phone_cleaned[0]} {phone_cleaned[1:4]} {phone_cleaned[4:7]}-{phone_cleaned[7:9]}-{phone_cleaned[9:11]}"
        else:
            formatted_phone = phone
        
        data.append({
            'id': booking.id,
            'time': booking.time.strftime('%H:%M'),
            'client_name': booking.client_name,
            'service_name': booking.service.name,
            'category_name': booking.service.category.name if booking.service.category else None,
            'service_duration': booking.service.duration,
            'phone': formatted_phone
        })
    
    return JsonResponse({'bookings': data})


# ============================================================
# СТАТУС ДНЯ (МОДАЛКА ДНЯ)
# ============================================================

@login_required
def get_day_status(request):
    """API: возвращает статус конкретного дня (рабочий, выходной, допдень)."""
    master = request.user.master
    date_str = request.GET.get('date')
    
    if not date_str:
        return JsonResponse({'error': 'Дата не указана'}, status=400)
    
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    day_of_week = target_date.weekday()
    
    extra_day = ExtraWorkingDay.objects.filter(master=master, date=target_date).first()
    is_day_off = DayOff.objects.filter(master=master, date=target_date).exists()
    schedule = Schedule.objects.filter(master=master, day_of_week=day_of_week).first()
    
    # Определяем рабочие часы (приоритет: extra_day > schedule)
    start_time = None
    end_time = None

    if extra_day:
        start_time = extra_day.start_time.strftime('%H:%M')
        end_time = extra_day.end_time.strftime('%H:%M')
        # Берём перерывы из extra_day
        breaks = [{
            'start': b.start_time.strftime('%H:%M'),
            'end': b.end_time.strftime('%H:%M')
        } for b in extra_day.breaks.all()]
    elif schedule:
        start_time = schedule.start_time.strftime('%H:%M')
        end_time = schedule.end_time.strftime('%H:%M')
        # Берём перерывы из schedule
        breaks = [{
            'start': b.start_time.strftime('%H:%M'),
            'end': b.end_time.strftime('%H:%M')
        } for b in schedule.breaks.all()]
    else:
        breaks = []
    
    return JsonResponse({
        'is_extra': extra_day is not None,
        'is_day_off': is_day_off,
        'has_schedule': schedule is not None,
        'schedule_start': start_time,
        'schedule_end': end_time,
        'extra_start': start_time,  # для совместимости с шаблоном
        'extra_end': end_time,      # для совместимости с шаблоном
        'breaks': breaks,
        'date': date_str
    })
    