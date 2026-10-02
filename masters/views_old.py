from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy
from django.contrib.auth import logout as auth_logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import BlacklistedClient, Master, Service, Booking, Schedule, DayOff, PhoneVerification, CustomUser, Break, ExtraWorkingDay, ExtraWorkingDayBreak, ServiceCategory, Notification, SupportMessage, PushSubscription, ClientSession
from .forms import PhoneRegistrationForm, PhoneVerificationForm

from .utils.schedule_utils import ScheduleCalculator
from .utils.response_utils import api_success, api_error

from .utils.master_utils import get_master_by_identifier
from django.http import Http404


from datetime import datetime, timedelta, date
import random
import json

from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

from .utils.sms_utils import send_sms
from .utils.call_utils import request_call_verification, check_call_status

from django.http import HttpResponse
from django.conf import settings

from django.http import HttpResponse
from django.conf import settings
import os

from .utils.push_utils import send_push_to_master

import logging
logger = logging.getLogger(__name__)


# ============================================================
# ======================= УТИЛИТЫ ============================
# ============================================================ 

def get_weekday_ru(date_obj):
    weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    return weekdays[date_obj.weekday()]

def get_month_ru(date_obj):
    months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]
    return months[date_obj.month - 1]

def format_phone(phone):
    """Форматирует 79991234567 -> 7 999 123-45-67"""
    if not phone or len(phone) != 11:
        return phone
    return f"{phone[0]} {phone[1:4]} {phone[4:7]}-{phone[7:9]}-{phone[9:11]}"



# ============================================================
# ======================= ГЛАВНЫЕ ============================
# ============================================================ 

def home(request):
    return render(request, 'masters/public/index.html')



def service_worker(request):
    """Отдаёт service-worker.js из корня сайта"""
    sw_path = os.path.join(settings.BASE_DIR, 'static', 'service-worker.js')
    if not os.path.exists(sw_path):
        return HttpResponse('// SW not found', content_type='application/javascript', status=404)
    
    with open(sw_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    response = HttpResponse(content, content_type='application/javascript')
    response['Service-Worker-Allowed'] = '/'
    response['Cache-Control'] = 'no-cache'
    return response

@login_required
def dashboard(request):
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
    from cryptography.fernet import Fernet, InvalidToken
    import re
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
# ======================= API Дашборда =======================
# ============================================================ 

@login_required
def get_calendar_schedule(request):
    """API для получения расписания мастера для календаря (с учетом доп. дней)"""
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


@login_required
def get_bookings_api(request):
    """API для получения записей с пагинацией"""
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
    
    from cryptography.fernet import Fernet, InvalidToken
    import re
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
        
        # ФОРМИРУЕМ НАЗВАНИЕ УСЛУГИ С КАТЕГОРИЕЙ
        service_name = booking.service.name
        if booking.service.category:
            service_name = f"{booking.service.category.name}: {service_name}"
        
        data.append({
            'id': booking.id,
            'date': date_display,
            'time': booking.time.strftime('%H:%M'),
            'client_name': booking.client_name,
            'service_name': service_name,  # ← теперь с категорией
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
    """API для получения подробной информации о записи и клиенте"""
    try:
        booking = get_object_or_404(Booking, id=booking_id, master=request.user.master)
        master = request.user.master
        
        # Расшифровываем телефон
        from cryptography.fernet import Fernet, InvalidToken
        import re
        key = master.get_encryption_key()
        
        phone = ''
        if key:
            try:
                f = Fernet(key)
                decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
                phone = decrypted
            except (InvalidToken, Exception) as e:
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
        ).select_related('service')
        
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
                    'service': b.service.name
                })
        
        # Сортируем визиты по дате (сначала новые)
        visits.sort(key=lambda x: x['date'], reverse=True)
        
        # 👇 ВАЖНО: формат services должен совпадать с тем, что ожидает шаблон
        # В шаблоне используется service.booking_id и service.time
        current_services = [{
            'booking_id': booking.id,  # ← обязательно booking_id!
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
            'services': current_services,  # ← теперь в правильном формате
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
            'all_booking_ids': [booking.id]  # ← добавляем для совместимости
        })

    except Exception as e:
        logger.exception(f"Ошибка в get_booking_details: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    

# Подтверждение записи
@login_required
@require_http_methods(["POST"])
def api_confirm_booking(request, booking_id):
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
# ======================= МАСТЕР ДОБАВЛЯЕТ ===================
# ============================================================ 

@login_required
def add_manual_booking(request):
    """Ручное добавление записи мастером"""
    master = request.user.master

    prefill_date = request.GET.get('date', '')
    
    if request.method == 'POST':
        client_name = request.POST.get('client_name')
        client_phone = request.POST.get('client_phone')
        service_id = request.POST.get('service')
        date_str = request.POST.get('date')
        time_str = request.POST.get('time')
        comment = request.POST.get('comment', '')
        force = False
        
        if not all([client_name, client_phone, service_id, date_str, time_str]):
            messages.error(request, 'Заполните все обязательные поля')
            return redirect('add_manual_booking')
        
        # ОЧИЩАЕМ И ВАЛИДИРУЕМ ТЕЛЕФОН
        import re
        client_phone_cleaned = re.sub(r'\D', '', client_phone)
        
        # Проверяем формат российского номера
        if BlacklistedClient.objects.filter(master=master, phone=client_phone_cleaned).exists():
            return JsonResponse({'error': 'Этот клиент находится в чёрном списке'}, status=403)
    
        if len(client_phone_cleaned) != 11:
            messages.error(request, 'Номер телефона должен содержать 11 цифр')
            return redirect('add_manual_booking')
        
        if not client_phone_cleaned.startswith('7'):
            messages.error(request, 'Номер должен начинаться с 7')
            return redirect('add_manual_booking')
        
        service = get_object_or_404(Service, id=service_id, master=master)
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        booking_time = datetime.strptime(time_str, '%H:%M').time()
        
        # Проверяем, не занято ли время
        calculator = ScheduleCalculator(master)
        slots = calculator.generate_time_slots(booking_date, service.duration)
        
        is_available = any(slot['start'] == time_str for slot in slots)
        if not is_available:
            messages.error(request, '❌ Это время уже занято. Выберите другое время.')
            return redirect('add_manual_booking')
        
        # Шифруем ОЧИЩЕННЫЙ телефон
        from cryptography.fernet import Fernet
        key = master.get_encryption_key()
        if key:
            f = Fernet(key)
            encrypted_phone = f.encrypt(client_phone_cleaned.encode())
        else:
            encrypted_phone = client_phone_cleaned.encode()
        
        booking = Booking.objects.create(
            master=master,
            service=service,
            client_name=client_name,
            encrypted_phone=encrypted_phone,
            client_comment=comment,
            date=booking_date,
            time=booking_time,
            status='confirmed',
            created_by='master'
        )

        logger.info(f"Мастер создал запись #{booking.id} для {client_name} на {booking_date} {booking_time}")
        
        messages.success(request, f'Запись для {client_name} добавлена!')
        return redirect('dashboard')
    
    # GET запрос - показываем форму
    services = Service.objects.filter(master=master, is_active=True)
    today = date.today()
    
    return render(request, 'masters/add_manual_booking.html', {
        'services': services,
        'today': today,
        'master': master,
        'prefill_date': prefill_date
    })

@login_required
def get_booking_slots_for_master(request):
    """API для получения слотов при ручном добавлении"""
    master = request.user.master
    service_id = request.GET.get('service_id')
    date_str = request.GET.get('date')
    
    if not service_id or not date_str:
        return JsonResponse({'error': 'Не указаны параметры'}, status=400)
    
    try:
        service = Service.objects.get(id=service_id, master=master)
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except (Service.DoesNotExist, ValueError):
        return JsonResponse({'error': 'Неверные параметры'}, status=404)
    
    calculator = ScheduleCalculator(master)
    
    # Определяем, нужно ли передавать текущее время
    current_time = None
    if target_date == date.today():
        from datetime import datetime
        current_time = datetime.now().time()
    
    slots = calculator.generate_time_slots(
        target_date, 
        service.duration,
        current_time=current_time
    )
    
    return JsonResponse({'slots': slots})



@login_required
def get_booking_for_edit(request, booking_id):
    """API для получения данных записи для редактирования"""
    booking = get_object_or_404(Booking, id=booking_id, master=request.user.master)
    
    # Расшифровываем телефон
    from cryptography.fernet import Fernet, InvalidToken
    import re
    key = request.user.master.get_encryption_key()
    
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
    
    return JsonResponse({
        'id': booking.id,
        'client_name': booking.client_name,
        'client_phone': phone,
        'service_id': booking.service.id,
        'service_name': booking.service.name,
        'service_duration': booking.service.duration,
        'date': booking.date.strftime('%Y-%m-%d'),
        'time': booking.time.strftime('%H:%M'),
        'comment': booking.client_comment,
        'status': booking.status
    })

@login_required
@require_http_methods(["POST"])
def api_update_booking(request, booking_id):
    try:
        import re
        from cryptography.fernet import Fernet
        
        try:
            booking = Booking.objects.get(id=booking_id, master=request.user.master)
        except Booking.DoesNotExist:
            return api_error('Запись не найдена', status=404)
        
        data = json.loads(request.body)
        
        service_id = data.get('service_id')
        client_name = data.get('client_name')
        client_phone = data.get('client_phone')
        date_str = data.get('date')
        time_str = data.get('time')
        comment = data.get('comment', '')
        status = data.get('status', 'confirmed')
        
        # Валидация обязательных полей
        if not all([service_id, client_name, client_phone, date_str, time_str]):
            return api_error('Заполните все поля', status=400)
        
        # Валидация телефона
        client_phone_cleaned = re.sub(r'\D', '', client_phone)
        if len(client_phone_cleaned) != 11 or not client_phone_cleaned.startswith('7'):
            return api_error('Неверный формат телефона', status=400)
        
        # Проверка услуги
        try:
            service = Service.objects.get(id=service_id, master=request.user.master)
        except Service.DoesNotExist:
            return api_error('Услуга не найдена', status=404)
        
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        target_time = datetime.strptime(time_str, '%H:%M').time()
        
        # Проверка свободного времени
        calculator = ScheduleCalculator(request.user.master)
        slots = calculator.generate_time_slots(
            target_date, 
            service.duration,
            exclude_booking_id=booking.id,
            original_booking_id=booking.id
        )
        
        is_available = any(slot['start'] == time_str for slot in slots)
        
        if not is_available and (booking.date != target_date or booking.time != target_time):
            return api_error('Это время уже занято', status=409)
        
        # Шифрование телефона
        key = request.user.master.get_encryption_key()
        if key:
            f = Fernet(key)
            encrypted_phone = f.encrypt(client_phone_cleaned.encode())
        else:
            encrypted_phone = client_phone_cleaned.encode()
        
        # Обновление записи
        booking.service = service
        booking.client_name = client_name
        booking.encrypted_phone = encrypted_phone
        booking.client_comment = comment
        booking.date = target_date
        booking.time = target_time
        booking.status = status
        booking.save()
        
        return api_success({'message': 'Запись обновлена'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты или времени: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при обновлении записи', status=500)

@login_required
@require_http_methods(["POST"])
def api_delete_booking(request, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id, master=request.user.master)
        booking.delete()
        return api_success({'message': 'Запись удалена'})
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении записи', status=500)




# ============================================================
# ================ ДОПДНИ и ВЫХОДНЫЕ =========================
# ============================================================ 

@login_required
@require_http_methods(["POST"])
def api_add_extra_day(request):
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        date_str = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        breaks = data.get('breaks', [])
        
        # ===== ВСЕ ПРОВЕРКИ ДО СОЗДАНИЯ =====
        
        if not date_str or not start_time or not end_time:
            return api_error('Заполните все обязательные поля', status=400)
        
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # 1. Проверка: дата не в прошлом
        if target_date < date.today():
            return api_error('Нельзя добавить рабочий день в прошлом', status=400)
        
        # 2. Проверка: время начала < время окончания
        if start_time >= end_time:
            return api_error('Время начала не может быть позже времени окончания', status=400)
        
        # 3. Проверка всех перерывов
        for break_data in breaks:
            if break_data.get('start') and break_data.get('end'):
                if break_data['start'] >= break_data['end']:
                    return api_error(
                        f'Перерыв {break_data["start"]}-{break_data["end"]}: время начала не может быть позже окончания',
                        status=400
                    )
                if break_data['start'] < start_time or break_data['end'] > end_time:
                    return api_error(
                        f'Перерыв {break_data["start"]}-{break_data["end"]} выходит за пределы рабочего дня ({start_time}-{end_time})',
                        status=400
                    )
        
        # 4. Проверка пересечения перерывов
        for i in range(len(breaks)):
            for j in range(i + 1, len(breaks)):
                b1 = breaks[i]
                b2 = breaks[j]
                if b1.get('start') and b1.get('end') and b2.get('start') and b2.get('end'):
                    if b1['start'] < b2['end'] and b2['start'] < b1['end']:
                        return api_error(
                            f'Перерывы {b1["start"]}-{b1["end"]} и {b2["start"]}-{b2["end"]} пересекаются между собой',
                            status=400
                        )
        
        # ===== ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ → СОЗДАЕМ =====
        
        # Удаляем существующие записи для этой даты
        ExtraWorkingDay.objects.filter(master=master, date=target_date).delete()
        DayOff.objects.filter(master=master, date=target_date).delete()
        
        extra_day = ExtraWorkingDay.objects.create(
            master=master,
            date=target_date,
            start_time=datetime.strptime(start_time, '%H:%M').time(),
            end_time=datetime.strptime(end_time, '%H:%M').time()
        )
        
        for break_data in breaks:
            if break_data.get('start') and break_data.get('end'):
                ExtraWorkingDayBreak.objects.create(
                    extra_day=extra_day,
                    start_time=datetime.strptime(break_data['start'], '%H:%M').time(),
                    end_time=datetime.strptime(break_data['end'], '%H:%M').time()
                )
        
        return api_success({'message': 'Дополнительный рабочий день добавлен'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты или времени: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при добавлении дополнительного рабочего дня', status=500)



@login_required
def get_bookings_counts(request):
    """API для получения количества записей по датам"""
    master = request.user.master
    bookings = Booking.objects.filter(master=master, status='confirmed')
    
    counts = {}
    for booking in bookings:
        date_str = booking.date.strftime('%Y-%m-%d')
        counts[date_str] = counts.get(date_str, 0) + 1
    
    return JsonResponse({'counts': counts})


@login_required
def get_bookings_by_date(request):
    """API для получения записей на конкретную дату"""
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
    
    from cryptography.fernet import Fernet, InvalidToken
    import re
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
            'service_duration': booking.service.duration,  # ← ДОБАВЬТЕ ЭТУ СТРОКУ
            'phone': formatted_phone
        })
    
    return JsonResponse({'bookings': data})




# ============================================================
# ======================= СТАТИСТИКА =========================
# ============================================================ 

@login_required
def clients_statistics(request):
    """Статистика клиентов мастера + чёрный список"""
    master = request.user.master
    
    # bookings = Booking.objects.filter(
    #     master=master
    # ).select_related('service')
    bookings = Booking.objects.filter(master=master, status='confirmed').select_related('service')
    
    from collections import defaultdict
    import re
    from cryptography.fernet import Fernet, InvalidToken
    
    key = master.get_encryption_key()
    
    # Группируем по клиентам
    clients_data = defaultdict(lambda: {
        'names': set(),
        'phone': '',
        'total_visits': 0,
        'services': defaultdict(int),
        'last_visit': None,
        'first_visit': None
    })
    
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
        
        phone_cleaned = re.sub(r'\D', '', phone)
        client_key = phone_cleaned
        
        clients_data[client_key]['names'].add(booking.client_name)
        clients_data[client_key]['phone'] = phone_cleaned
        clients_data[client_key]['total_visits'] += 1
        clients_data[client_key]['services'][booking.service.name] += 1
        
        if clients_data[client_key]['first_visit'] is None or booking.date < clients_data[client_key]['first_visit']:
            clients_data[client_key]['first_visit'] = booking.date
        if clients_data[client_key]['last_visit'] is None or booking.date > clients_data[client_key]['last_visit']:
            clients_data[client_key]['last_visit'] = booking.date
    
    # Получаем список заблокированных телефонов
    blacklisted_phones = set(BlacklistedClient.objects.filter(master=master).values_list('phone', flat=True))
    
    # Преобразуем в список для шаблона
    clients_list = []
    for client_key, data in clients_data.items():
        names_list = list(data['names'])
        if len(names_list) == 1:
            client_name = names_list[0]
        else:
            client_name = f"{names_list[0]} (+{len(names_list)-1})"
        
        # Форматируем телефон для отображения
        phone_raw = data['phone']
        if len(phone_raw) == 11:
            formatted_phone = f"{phone_raw[0]} {phone_raw[1:4]} {phone_raw[4:7]}-{phone_raw[7:9]}-{phone_raw[9:11]}"
        else:
            formatted_phone = phone_raw
        
        clients_list.append({
            'key': client_key,
            'name': client_name,
            'phone': formatted_phone,
            'total_visits': data['total_visits'],
            'first_visit': data['first_visit'],
            'last_visit': data['last_visit'],
            'services': dict(data['services']),
            'all_names': list(data['names']),
            'is_blacklisted': client_key in blacklisted_phones
        })
    
    # Сортируем по количеству визитов (по убыванию)
    # clients_list.sort(key=lambda x: x['total_visits'], reverse=True)
    clients_list.sort(key=lambda x: (-x['total_visits'], x['key']))
    
    # Пагинация
    page = int(request.GET.get('page', 1))
    limit = 10
    offset = (page - 1) * limit
    
    total = len(clients_list)
    has_more = offset + limit < total
    clients_page = clients_list[offset:offset + limit]
    
    # Чёрный список
    blacklisted_clients = BlacklistedClient.objects.filter(master=master).order_by('-created_at')
    
    context = {
        'clients': clients_page,
        'total_clients': total,
        'total_bookings': bookings.count(),
        'avg_visits_per_client': round(bookings.count() / total, 1) if total else 0,
        'master': master,
        'blacklisted_clients': blacklisted_clients,
        'page': page,
        'has_more': has_more,
    }
    
    return render(request, 'masters/clients_statistics.html', context)

@login_required
def get_clients_statistics_api(request):
    """API для получения статистики клиентов с пагинацией"""
    master = request.user.master
    
    # Берём ВСЕ записи (не только confirmed)
    # bookings = Booking.objects.filter(master=master).select_related('service')
    bookings = Booking.objects.filter(master=master, status='confirmed').select_related('service')

    
    from collections import defaultdict
    import re
    from cryptography.fernet import Fernet, InvalidToken
    
    key = master.get_encryption_key()
    
    clients_data = defaultdict(lambda: {
        'names': set(),
        'phone': '',
        'total_visits': 0,
        'services': defaultdict(int),
        'last_visit': None,
        'first_visit': None
    })
    
    for booking in bookings:
        # Расшифровка телефона
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
        
        client_key = phone_cleaned
        
        clients_data[client_key]['names'].add(booking.client_name)
        clients_data[client_key]['phone'] = formatted_phone
        clients_data[client_key]['total_visits'] += 1
        clients_data[client_key]['services'][booking.service.name] += 1
        
        if clients_data[client_key]['first_visit'] is None or booking.date < clients_data[client_key]['first_visit']:
            clients_data[client_key]['first_visit'] = booking.date
        if clients_data[client_key]['last_visit'] is None or booking.date > clients_data[client_key]['last_visit']:
            clients_data[client_key]['last_visit'] = booking.date
    
    # Получаем список заблокированных телефонов
    blacklisted_phones = set(BlacklistedClient.objects.filter(master=master).values_list('phone', flat=True))
    
    clients_list = []
    for client_key, data in clients_data.items():
        most_popular_service = max(data['services'].items(), key=lambda x: x[1]) if data['services'] else ('Нет', 0)
        
        names_list = list(data['names'])
        if len(names_list) == 1:
            client_name = names_list[0]
        else:
            client_name = f"{names_list[0]} (+{len(names_list)-1})"
        
        clients_list.append({
            'key': client_key,
            'name': client_name,
            'phone': data['phone'],
            'total_visits': data['total_visits'],
            'most_popular_service': most_popular_service[0],
            'most_popular_service_count': most_popular_service[1],
            'first_visit': data['first_visit'].strftime('%d.%m.%Y') if data['first_visit'] else None,
            'last_visit': data['last_visit'].strftime('%d.%m.%Y') if data['last_visit'] else None,
            'services': dict(data['services']),
            'all_names': list(data['names']),
            'is_blacklisted': client_key in blacklisted_phones
        })
    
    # clients_list.sort(key=lambda x: x['total_visits'], reverse=True)
    clients_list.sort(key=lambda x: (-x['total_visits'], x['key']))
    
    # Пагинация
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    offset = (page - 1) * limit
    
    total = len(clients_list)
    has_more = offset + limit < total
    clients_page = clients_list[offset:offset + limit]
    
    return JsonResponse({
        'clients': clients_page,
        'total': total,
        'page': page,
        'has_more': has_more
    })

@login_required
def search_clients_api(request):
    """API для поиска клиентов по имени или телефону"""
    master = request.user.master
    query = request.GET.get('q', '').strip()
    
    if not query:
        return JsonResponse({'clients': [], 'total': 0})
    
    # Получаем все записи мастера
    # bookings = Booking.objects.filter(master=master).select_related('service')
    bookings = Booking.objects.filter(master=master, status='confirmed').select_related('service')
    
    
    from collections import defaultdict
    import re
    from cryptography.fernet import Fernet, InvalidToken
    
    key = master.get_encryption_key()
    
    # Группируем по клиентам
    clients_data = defaultdict(lambda: {
        'names': set(),
        'phone': '',
        'total_visits': 0,
        'services': defaultdict(int),
        'last_visit': None,
        'first_visit': None
    })
    
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
        
        phone_cleaned = re.sub(r'\D', '', phone)
        client_key = phone_cleaned
        
        clients_data[client_key]['names'].add(booking.client_name)
        clients_data[client_key]['phone'] = phone_cleaned
        clients_data[client_key]['total_visits'] += 1
        clients_data[client_key]['services'][booking.service.name] += 1
        
        if clients_data[client_key]['first_visit'] is None or booking.date < clients_data[client_key]['first_visit']:
            clients_data[client_key]['first_visit'] = booking.date
        if clients_data[client_key]['last_visit'] is None or booking.date > clients_data[client_key]['last_visit']:
            clients_data[client_key]['last_visit'] = booking.date
    
    # Фильтруем по запросу
    search_term = query.lower()
    results = []
    
    for client_key, data in clients_data.items():
        # Форматируем телефон для отображения
        phone_raw = data['phone']
        if len(phone_raw) == 11:
            formatted_phone = f"{phone_raw[0]} {phone_raw[1:4]} {phone_raw[4:7]}-{phone_raw[7:9]}-{phone_raw[9:11]}"
        else:
            formatted_phone = phone_raw
        
        # Проверяем совпадения
        names_list = list(data['names'])
        main_name = names_list[0] if names_list else ''
        all_names_str = ' '.join(names_list).lower()
        phone_search = phone_raw.replace(phone_raw[0], '', 1)  # убираем первую цифру для поиска
        
        if (search_term in main_name.lower() or 
            search_term in all_names_str or 
            search_term in phone_raw or 
            search_term in phone_search):
            
            if len(names_list) == 1:
                client_name = names_list[0]
            else:
                client_name = f"{names_list[0]} (+{len(names_list)-1})"
            
            # Получаем список заблокированных телефонов
            blacklisted_phones = set(BlacklistedClient.objects.filter(master=master).values_list('phone', flat=True))
            
            results.append({
                'key': client_key,
                'name': client_name,
                'phone': formatted_phone,
                'total_visits': data['total_visits'],
                'first_visit': data['first_visit'].strftime('%d.%m.%Y') if data['first_visit'] else None,
                'last_visit': data['last_visit'].strftime('%d.%m.%Y') if data['last_visit'] else None,
                'services': dict(data['services']),
                'all_names': list(data['names']),
                'is_blacklisted': client_key in blacklisted_phones
            })
    
    # Сортируем по количеству визитов
    results.sort(key=lambda x: x['total_visits'], reverse=True)
    
    # Ограничиваем результат (максимум 50)
    results = results[:50]
    
    return JsonResponse({
        'clients': results,
        'total': len(results),
        'query': query
    })

@login_required
def get_decrypted_phone(request, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id, master=request.user.master)
        
        from cryptography.fernet import Fernet, InvalidToken
        import re
        
        key = request.user.master.get_encryption_key()
        
        if not key:
            return api_error('Ключ шифрования не найден', status=400)
        
        try:
            f = Fernet(key)
            decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
        except InvalidToken:
            try:
                decrypted = booking.encrypted_phone.decode('utf-8')
            except:
                return api_error('Ошибка расшифровки', status=400)
        
        phone_cleaned = re.sub(r'\D', '', decrypted)
        if len(phone_cleaned) == 11:
            formatted_phone = f"{phone_cleaned[0]} {phone_cleaned[1:4]} {phone_cleaned[4:7]}-{phone_cleaned[7:9]}-{phone_cleaned[9:11]}"
        else:
            formatted_phone = decrypted
        
        return api_success({'phone': formatted_phone})
        
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка при расшифровке', status=500)

# ============================================================
# ======================= ЧЕРНЫЙ СПИСОК ======================
# ============================================================ 

@login_required
@require_http_methods(["POST"])
def api_blacklist_add(request):
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        phone = data.get('phone')
        name = data.get('name', '')
        reason = data.get('reason', '')
        
        import re
        phone_cleaned = re.sub(r'\D', '', phone)
        
        if not phone_cleaned or len(phone_cleaned) != 11:
            return api_error('Неверный формат номера', status=400)
        
        # Добавляем или обновляем
        obj, created = BlacklistedClient.objects.update_or_create(
            master=master,
            phone=phone_cleaned,
            defaults={'name': name, 'reason': reason}
        )
        
        # Отменяем все будущие записи этого клиента
        from django.utils import timezone
        today = date.today()
        
        from cryptography.fernet import Fernet
        key = master.get_encryption_key()
        
        cancelled_count = 0
        if key:
            f = Fernet(key)
            future_bookings = Booking.objects.filter(
                master=master,
                date__gte=today,
                status='confirmed'
            )
            
            for booking in future_bookings:
                try:
                    decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
                    if re.sub(r'\D', '', decrypted) == phone_cleaned:
                        booking.status = 'cancelled'
                        booking.save()
                        cancelled_count += 1
                except:
                    pass
        
        return api_success({
            'created': created,
            'cancelled_count': cancelled_count,
            'client': {
                'id': obj.id,
                'phone': obj.phone,
                'name': obj.name,
                'reason': obj.reason,
                'created_at': obj.created_at.strftime('%d.%m.%Y %H:%M')
            }
        })
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при добавлении в черный список', status=500)

@login_required
@require_http_methods(["POST"])
def api_blacklist_delete(request, client_id):
    try:
        client = BlacklistedClient.objects.get(id=client_id, master=request.user.master)
        client.delete()
        return api_success({'message': 'Клиент удален из черного списка'})
    except BlacklistedClient.DoesNotExist:
        return api_error('Клиент не найден', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении из черного списка', status=500)



from django.http import JsonResponse
from .utils.schedule_utils import ScheduleCalculator
import json


def get_available_dates(request, identifier):
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
            'display': f"{d.day} {get_month_ru(d)}",
            'day_of_week': get_weekday_ru(d)
        } for d in dates_page]
        
        return JsonResponse({
            'dates': dates_list,
            'total': total,
            'page': page,
            'limit': limit,
            'has_more': has_more
        })

    except Exception as e:
        logger.exception(f"Ошибка в get_available_dates: {e}")
        return JsonResponse({'error': str(e)}, status=500)

# ============================================================
# =================== ПУБЛИЧНЫЕ СТРАНИЦЫ =====================
# ============================================================ 

def get_available_slots(request, identifier):
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
            from datetime import datetime as dt
            current_time = dt.now().time()
        
        slots = calculator.generate_time_slots(
            target_date, 
            duration,
            exclude_booking_id=int(exclude_booking_id) if exclude_booking_id else None,
            current_time=current_time,
            original_booking_id=int(original_booking_id) if original_booking_id else None
        )
        
        return JsonResponse({'slots': slots})

    except Exception as e:
        logger.exception(f"Ошибка в get_available_slots: {e}")
        return JsonResponse({'error': str(e)}, status=500)
        

def create_booking(request, identifier):
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        import re
        from cryptography.fernet import Fernet
        
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
        
        booking = Booking.objects.create(
            master=master,
            service=service,
            client_name=client_name,
            encrypted_phone=encrypted_phone,
            client_comment=comment,
            date=booking_date,
            time=booking_time,
            status='confirmed',
            created_by=created_by
        )
        
        return api_success({
            'message': 'Запись создана!',
            'booking': {
                'id': booking.id,
                'date': booking.date.strftime('%d.%m.%Y'),
                'time': booking.time.strftime('%H:%M'),
                'service': service.name
            }
        })
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты или времени: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при создании записи', status=500)


def create_multiple_bookings(request, identifier):
    if request.method != 'POST':
        return api_error('Метод не поддерживается', status=405)
    
    try:
        import re
        from cryptography.fernet import Fernet
        from datetime import timedelta
        
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
        
        for i, service in enumerate(services):
            booking_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=time_offset)).time()
            
            if len(services) > 1:
                service_comment = f"{comment} (услуга {i+1} из {len(services)}: {service.name})"
            else:
                service_comment = comment
            
            booking = Booking.objects.create(
                master=master,
                service=service,
                client_name=client_name,
                encrypted_phone=encrypted_phone,
                client_comment=service_comment,
                date=booking_date,
                time=booking_time,
                status='confirmed',
                created_by=created_by
            )
            created_bookings.append(booking)
            services_list.append(service.name)
            time_offset += service.duration
        
        end_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=total_duration)).strftime('%H:%M')
        
        if created_by == 'client':
            from .models import Notification
            notification_lines = []
            notification_lines.append(f"📅 {booking_date.strftime('%d.%m.%Y')}")
            
            time_offset = 0
            for i, service in enumerate(services):
                booking_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=time_offset)).strftime('%H:%M')
                notification_lines.append(f"⏰ {booking_time} - {service.name}")
                time_offset += service.duration
            
            notification_message = "\n".join(notification_lines)
            
            Notification.objects.create(
                master=master,
                type='new_booking',
                title=f"{client_name}" + (f" ({len(services_list)} услуги)" if len(services_list) > 1 else ""),
                message=notification_message,
                content_object=created_bookings[0]
            )

            from .utils.push_utils import send_push_to_master
            
            # Формируем краткий текст
            if len(services) == 1:
                service_text = services[0].name
            else:
                service_text = f'{len(services)} услуги'
            
            push_title = '📅 Новая запись'
            push_body = f'{client_name} · {start_time_str} · {service_text}'

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
            
        
        return api_success({
            'message': f'✅ Запись на {len(created_bookings)} услуг создана!',
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
    

def master_by_id(request, master_id):
    """Публичная страница мастера по ID"""
    master = get_object_or_404(Master, id=master_id)
    services = Service.objects.filter(master=master, is_active=True)
    
    return render(request, 'masters/public/master_page.html', {
        'master': master,
        'services': services
    })

def master_by_login(request, login):
    """Публичная страница мастера по логину"""
    master = get_object_or_404(Master, login=login)
    services = Service.objects.filter(master=master, is_active=True)
    
    return render(request, 'masters/public/master_page.html', {
        'master': master,
        'services': services
    })

@login_required
def get_day_status(request):
    """API для получения статуса конкретного дня"""
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





# ============================================================
# ============= КЛИЕНТ: УПРАВЛЕНИЕ ЗАПИСЬЮ ===================
# ============================================================

def client_booking_view(request, identifier, token):
    """
    Страница клиента для просмотра/изменения/отмены записи.
    Открывается по ссылке из push/SMS: /booking/<token>/
    """
    booking = get_object_or_404(Booking, token=token, status='confirmed')
    
    # Расшифровываем телефон для отображения (частично)
    from cryptography.fernet import Fernet, InvalidToken
    import re
    
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
    
    # Получаем все услуги в этот день для этого клиента (если это часть составной записи)
    # Показываем только эту запись
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
    """
    API: получить данные записи по токену.
    """
    try:
        booking = Booking.objects.get(token=token, status='confirmed')
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    
    # Доступные слоты для изменения (начиная с сегодня)
    from .utils.schedule_utils import ScheduleCalculator
    calculator = ScheduleCalculator(booking.master)
    
    # Получаем доступные даты
    dates = calculator.get_available_dates(
        days_ahead=60,
        min_service_duration=booking.service.duration
    )
    
    # Форматируем
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
    """
    API: получить доступные слоты для изменения записи.
    """
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
    
    from .utils.schedule_utils import ScheduleCalculator
    calculator = ScheduleCalculator(booking.master)
    
    current_time = None
    if target_date == date.today():
        from datetime import datetime as dt
        current_time = dt.now().time()
    
    slots = calculator.generate_time_slots(
        target_date,
        booking.service.duration,
        exclude_booking_id=booking.id,           # исключаем саму запись
        current_time=current_time,
        original_booking_id=booking.id           # разблокируем её время
    )
    
    return api_success({'slots': slots})


@csrf_exempt
def api_client_cancel_booking(request, identifier, token):
    """
    API: отмена записи клиентом.
    """
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
        from datetime import datetime as dt
        if booking.time < dt.now().time():
            return api_error('Время записи уже прошло, отменить её нельзя', status=400)
    
    # Меняем статус
    booking.status = 'cancelled'
    booking.save()

    logger.info(f"Клиент {booking.client_name} отменил запись #{booking.id} у мастера {booking.master.id}")
    
    # Уведомление мастеру
    from .models import Notification
    Notification.objects.create(
        master=booking.master,
        type='cancelled_booking',
        title=f'{booking.client_name}',
        message=f"📅 {booking.date.strftime('%d.%m.%Y')}\n⏰ {booking.time.strftime('%H:%M')} - {booking.service.name}",
        content_object=booking
    )
    
    # Push мастеру
    from .utils.push_utils import send_push_to_master
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
    """
    API: изменение записи клиентом.
    """
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
        from datetime import datetime as dt
        if booking.time < dt.now().time():
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
    from .utils.schedule_utils import ScheduleCalculator
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

    logger.info(
        f"Клиент {booking.client_name} перенёс запись #{booking.id} "
        f"с {old_date} {old_time} на {new_date} {new_time}"
    )
    
    # Уведомление мастеру
    from .models import Notification
    Notification.objects.create(
        master=booking.master,
        type='changed_booking',
        title=f'{booking.client_name}',
        message=f"📅 Стало: {new_date.strftime('%d.%m.%Y')} {new_time.strftime('%H:%M')}\n⏰ {booking.service.name}\n📅 Было: {old_date.strftime('%d.%m.%Y')} {old_time.strftime('%H:%M')}",
        content_object=booking
    )
    
    # Push мастеру
    from .utils.push_utils import send_push_to_master
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
# ============= КЛИЕНТ: АВТОРИЗАЦИЯ ПО ЗВОНКУ ================
# ============================================================
@csrf_exempt
def api_client_check_phone(request, identifier):
    """Проверяет, есть ли записи у клиента с указанным телефоном."""
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
    
    import re
    phone_cleaned = re.sub(r'\D', '', phone)
    if len(phone_cleaned) != 11:
        return api_error('Введите корректный номер телефона (11 цифр)', status=400)
    
    # Ищем записи с таким телефоном
    from cryptography.fernet import Fernet, InvalidToken
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
    """Запрашивает звонок для подтверждения клиента."""
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
    
    import re
    phone_cleaned = re.sub(r'\D', '', phone)
    
    # Проверка rate limit (защита от спама и слива баланса SMS.ru)
    from .utils.rate_limit import check_call_limits
    allowed, error_msg = check_call_limits(request, phone_cleaned)
    if not allowed:
        return api_error(error_msg, status=429)
    
    # Запрашиваем звонок через SMS.ru
    from .utils.call_utils import request_call_verification
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
    """Проверяет статус звонка. Если подтверждён — генерирует session_key."""
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
    from .utils.call_utils import check_call_status
    success, is_confirmed, status_text, error = check_call_status(check_id)
    
    if not success:
        return api_error(error or 'Ошибка проверки', status=500)
    
    if not is_confirmed:
        return api_success({'is_confirmed': False})
    
    # Подтверждён! Генерируем session_key
    import secrets
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



def my_bookings_view(request, identifier):
    """Страница «Мои записи» — для клиента."""
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return api_error('Мастер не найден', status=404)
    
    client_phone = request.session.get('client_phone')
    client_master_id = request.session.get('client_master_id')
    
    if not client_phone or client_master_id != master.id:
        return redirect(f'/{identifier}/')
    
    # Находим все записи клиента
    from cryptography.fernet import Fernet, InvalidToken
    import re
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

