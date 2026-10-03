"""
Записи: ручное добавление, редактирование, удаление.
"""
import json
import re
from datetime import datetime, date

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from cryptography.fernet import Fernet, InvalidToken

from ..models import Booking, Service, BlacklistedClient
from ..utils.schedule_utils import ScheduleCalculator
from ..utils.response_utils import api_success, api_error


@login_required
def add_manual_booking(request):
    """Ручное добавление записи мастером через форму."""
    master = request.user.master

    prefill_date = request.GET.get('date', '')
    
    if request.method == 'POST':
        client_name = request.POST.get('client_name')
        client_phone = request.POST.get('client_phone')
        service_id = request.POST.get('service')
        date_str = request.POST.get('date')
        time_str = request.POST.get('time')
        comment = request.POST.get('comment', '')
        
        if not all([client_name, client_phone, service_id, date_str, time_str]):
            messages.error(request, 'Заполните все обязательные поля')
            return redirect('add_manual_booking')
        
        # ОЧИЩАЕМ И ВАЛИДИРУЕМ ТЕЛЕФОН
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

        import logging
        logger = logging.getLogger(__name__)
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
    """API: возвращает свободные слоты для ручного добавления записи."""
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
        current_time = datetime.now().time()
    
    slots = calculator.generate_time_slots(
        target_date, 
        service.duration,
        current_time=current_time
    )
    
    return JsonResponse({'slots': slots})


@login_required
def get_booking_for_edit(request, booking_id):
    """API: возвращает данные записи для формы редактирования."""
    booking = get_object_or_404(Booking, id=booking_id, master=request.user.master)
    
    # Расшифровываем телефон
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
    """API: обновляет запись (имя, телефон, услугу, дату, время)."""
    try:
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
    """API: удаляет запись по ID."""
    try:
        booking = Booking.objects.get(id=booking_id, master=request.user.master)
        booking.delete()
        return api_success({'message': 'Запись удалена'})
    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении записи', status=500)