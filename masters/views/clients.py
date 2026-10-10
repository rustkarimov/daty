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
# ВСПОМОГАТЕЛЬНОЕ
# ============================================================

def _decrypt_phone(booking, key):
    """Расшифровывает телефон записи. Возвращает строку или ''."""
    if key:
        try:
            f = Fernet(key)
            return f.decrypt(bytes(booking.encrypted_phone)).decode()
        except (InvalidToken, Exception):
            try:
                return booking.encrypted_phone.decode('utf-8')
            except Exception:
                return str(booking.encrypted_phone)
    else:
        try:
            return booking.encrypted_phone.decode('utf-8')
        except Exception:
            return str(booking.encrypted_phone)


def _format_phone(phone_cleaned):
    """Форматирует 11-значный номер в 'X XXX XXX-XX-XX'."""
    if len(phone_cleaned) == 11:
        return f"{phone_cleaned[0]} {phone_cleaned[1:4]} {phone_cleaned[4:7]}-{phone_cleaned[7:9]}-{phone_cleaned[9:11]}"
    return phone_cleaned


def _collect_clients(master, only_confirmed=False):
    """
    Собирает список клиентов мастера.

    :param master: объект Master
    :param only_confirmed: если True — берём только записи со status='confirmed'.
                           Если False — берём все записи (включая cancelled), чтобы
                           клиент не пропадал из списка после отмены.
    :return: dict {client_key: {...}} и set() телефонов из ЧС
    """
    key = master.get_encryption_key()

    if only_confirmed:
        bookings = Booking.objects.filter(
            master=master, status='confirmed'
        ).select_related('service', 'service__category')
    else:
        bookings = Booking.objects.filter(
            master=master
        ).select_related('service', 'service__category')

    clients_data = defaultdict(lambda: {
        'names': set(),
        'phone': '',
        'phone_raw': '',
        'total_visits': 0,
        'services': defaultdict(int),
        'last_visit': None,
        'first_visit': None,
    })

    today = date.today()

    for booking in bookings:
        phone = _decrypt_phone(booking, key)
        phone_cleaned = re.sub(r'\D', '', phone)
        if not phone_cleaned:
            continue

        client_key = phone_cleaned

        clients_data[client_key]['names'].add(booking.client_name)
        clients_data[client_key]['phone'] = _format_phone(phone_cleaned)
        clients_data[client_key]['phone_raw'] = phone_cleaned

        # «Визит» = confirmed + дата в прошлом (или сегодня)
        if booking.status == 'confirmed' and booking.date <= today:
            clients_data[client_key]['total_visits'] += 1

        # Услуги — только по подтверждённым
        if booking.status == 'confirmed':
            service_name = booking.service.name
            if booking.service.category:
                service_name = f"{booking.service.category.name}: {service_name}"
            clients_data[client_key]['services'][service_name] += 1

            if (clients_data[client_key]['first_visit'] is None
                    or booking.date < clients_data[client_key]['first_visit']):
                clients_data[client_key]['first_visit'] = booking.date
            if (clients_data[client_key]['last_visit'] is None
                    or booking.date > clients_data[client_key]['last_visit']):
                clients_data[client_key]['last_visit'] = booking.date

    # Добавляем клиентов из ЧС, которых нет в списке
    blacklisted = BlacklistedClient.objects.filter(master=master)
    for bl in blacklisted:
        if bl.phone not in clients_data:
            clients_data[bl.phone] = {
                'names': {bl.name or 'Без имени'},
                'phone': _format_phone(bl.phone),
                'phone_raw': bl.phone,
                'total_visits': 0,
                'services': defaultdict(int),
                'last_visit': None,
                'first_visit': None,
            }

    blacklisted_phones = set(blacklisted.values_list('phone', flat=True))

    return clients_data, blacklisted_phones


def _serialize_client(client_key, data, blacklisted_phones):
    """Преобразует данные клиента в формат для JSON."""
    names_list = sorted(data['names'])
    if len(names_list) == 1:
        client_name = names_list[0]
    else:
        client_name = f"{names_list[0]} (+{len(names_list)-1})"

    return {
        'key': client_key,
        'name': client_name,
        'phone': data['phone'],
        'total_visits': data['total_visits'],
        'first_visit': (
            data['first_visit'].strftime('%d.%m.%Y')
            if data['first_visit'] else None
        ),
        'last_visit': (
            data['last_visit'].strftime('%d.%m.%Y')
            if data['last_visit'] else None
        ),
        'services': dict(data['services']),
        'all_names': names_list,
        'is_blacklisted': client_key in blacklisted_phones,
    }


# ============================================================
# СТРАНИЦА (ванильная — оставляем для совместимости)
# ============================================================

@login_required
def clients_statistics(request):
    """Страница статистики клиентов мастера (Django-рендер, старая версия)."""
    master = request.user.master

    clients_data, blacklisted_phones = _collect_clients(master, only_confirmed=False)

    clients_list = [
        _serialize_client(key, data, blacklisted_phones)
        for key, data in clients_data.items()
    ]

    clients_list.sort(key=lambda x: (-x['total_visits'], x['key']))

    page = int(request.GET.get('page', 1))
    limit = 10
    offset = (page - 1) * limit

    total = len(clients_list)
    has_more = offset + limit < total
    clients_page = clients_list[offset:offset + limit]

    blacklisted_clients = BlacklistedClient.objects.filter(master=master).order_by('-created_at')

    total_bookings = Booking.objects.filter(master=master, status='confirmed').count()

    context = {
        'clients': clients_page,
        'total_clients': total,
        'total_bookings': total_bookings,
        'avg_visits_per_client': round(total_bookings / total, 1) if total else 0,
        'master': master,
        'blacklisted_clients': blacklisted_clients,
        'page': page,
        'has_more': has_more,
    }

    return render(request, 'masters/clients_statistics.html', context)


# ============================================================
# API: СПИСОК КЛИЕНТОВ
# ============================================================

@login_required
def get_clients_statistics_api(request):
    """API: возвращает статистику клиентов с пагинацией (JSON)."""
    master = request.user.master

    clients_data, blacklisted_phones = _collect_clients(master, only_confirmed=False)

    clients_list = [
        _serialize_client(key, data, blacklisted_phones)
        for key, data in clients_data.items()
    ]

    clients_list.sort(key=lambda x: (-x['total_visits'], x['key']))

    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    offset = (page - 1) * limit

    total = len(clients_list)
    has_more = offset + limit < total
    clients_page = clients_list[offset:offset + limit]

    # Считаем total_bookings и avg_visits
    total_bookings = Booking.objects.filter(master=master, status='confirmed').count()
    avg_visits = round(total_bookings / total, 1) if total else 0

    return JsonResponse({
        'clients': clients_page,
        'total': total,
        'total_bookings': total_bookings,
        'avg_visits': avg_visits,
        'page': page,
        'has_more': has_more,
    })


# ============================================================
# API: ПОИСК КЛИЕНТОВ
# ============================================================

@login_required
def search_clients_api(request):
    """API: поиск клиентов по имени или телефону."""
    master = request.user.master
    query = request.GET.get('q', '').strip()

    if not query:
        return JsonResponse({'clients': [], 'total': 0})

    clients_data, blacklisted_phones = _collect_clients(master, only_confirmed=False)

    search_term = query.lower()
    results = []

    for client_key, data in clients_data.items():
        names_list = sorted(data['names'])
        all_names_str = ' '.join(names_list).lower()
        phone_raw = data['phone_raw']
        phone_search = phone_raw.replace(phone_raw[0], '', 1) if phone_raw else ''

        if (search_term in all_names_str
                or search_term in phone_raw
                or search_term in phone_search):
            results.append(_serialize_client(client_key, data, blacklisted_phones))

    results.sort(key=lambda x: x['total_visits'], reverse=True)
    results = results[:50]

    return JsonResponse({
        'clients': results,
        'total': len(results),
        'query': query,
    })


# ============================================================
# API: РАСШИФРОВКА ТЕЛЕФОНА
# ============================================================

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
            except Exception:
                return api_error('Ошибка расшифровки', status=400)

        phone_cleaned = re.sub(r'\D', '', decrypted)
        return api_success({'phone': _format_phone(phone_cleaned)})

    except Booking.DoesNotExist:
        return api_error('Запись не найдена', status=404)
    except Exception:
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

        obj, created = BlacklistedClient.objects.update_or_create(
            master=master,
            phone=phone_cleaned,
            defaults={'name': name, 'reason': reason},
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
                status='confirmed',
            )

            for booking in future_bookings:
                try:
                    decrypted = f.decrypt(bytes(booking.encrypted_phone)).decode()
                    if re.sub(r'\D', '', decrypted) == phone_cleaned:
                        booking.status = 'cancelled'
                        booking.save()
                        cancelled_count += 1
                except Exception:
                    pass

        return api_success({
            'created': created,
            'cancelled_count': cancelled_count,
            'client': {
                'id': obj.id,
                'phone': obj.phone,
                'name': obj.name,
                'reason': obj.reason,
                'created_at': obj.created_at.strftime('%d.%m.%Y %H:%M'),
            },
        })

    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception:
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
    except Exception:
        return api_error('Ошибка при удалении из черного списка', status=500)


@login_required
def api_get_blacklist(request):
    """
    Возвращает список клиентов в чёрном списке.
    GET /api/blacklist/list/
    """
    master = request.user.master
    clients = BlacklistedClient.objects.filter(master=master).order_by('-created_at')

    data = [{
        'id': c.id,
        'phone': c.phone,
        'name': c.name or 'Без имени',
        'reason': c.reason or '',
        'created_at': c.created_at.strftime('%d.%m.%Y %H:%M'),
    } for c in clients]

    return JsonResponse({'blacklist': data})