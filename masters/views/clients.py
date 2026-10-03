"""
Клиенты мастера: статистика, поиск, чёрный список.
"""
import json
import re
from collections import defaultdict
from datetime import date

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from cryptography.fernet import Fernet, InvalidToken

from ..models import Booking, BlacklistedClient
from ..utils.response_utils import api_success, api_error


# ============================================================
# СТАТИСТИКА КЛИЕНТОВ
# ============================================================

@login_required
def clients_statistics(request):
    """Страница статистики клиентов мастера с пагинацией."""
    master = request.user.master
    
    bookings = Booking.objects.filter(master=master, status='confirmed').select_related('service')
    
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
    """API: возвращает статистику клиентов с пагинацией (JSON)."""
    master = request.user.master
    
    bookings = Booking.objects.filter(master=master, status='confirmed').select_related('service')
    
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
    """API: поиск клиентов по имени или телефону."""
    master = request.user.master
    query = request.GET.get('q', '').strip()
    
    if not query:
        return JsonResponse({'clients': [], 'total': 0})
    
    bookings = Booking.objects.filter(master=master, status='confirmed').select_related('service')
    
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
    
    # Получаем список заблокированных телефонов
    blacklisted_phones = set(BlacklistedClient.objects.filter(master=master).values_list('phone', flat=True))
    
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
        phone_search = phone_raw.replace(phone_raw[0], '', 1) if phone_raw else ''
        
        if (search_term in main_name.lower() or 
            search_term in all_names_str or 
            search_term in phone_raw or 
            search_term in phone_search):
            
            if len(names_list) == 1:
                client_name = names_list[0]
            else:
                client_name = f"{names_list[0]} (+{len(names_list)-1})"
            
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
    """API: возвращает расшифрованный телефон клиента по ID записи."""
    try:
        booking = Booking.objects.get(id=booking_id, master=request.user.master)
        
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
# ЧЁРНЫЙ СПИСОК
# ============================================================

@login_required
@require_http_methods(["POST"])
def api_blacklist_add(request):
    """Добавляет клиента в чёрный список и отменяет его будущие записи."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        phone = data.get('phone')
        name = data.get('name', '')
        reason = data.get('reason', '')
        
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
        today = date.today()
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
    """Удаляет клиента из чёрного списка."""
    try:
        client = BlacklistedClient.objects.get(id=client_id, master=request.user.master)
        client.delete()
        return api_success({'message': 'Клиент удален из черного списка'})
    except BlacklistedClient.DoesNotExist:
        return api_error('Клиент не найден', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении из черного списка', status=500)