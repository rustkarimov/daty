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

from ..models import Booking, BlacklistedClient, CancelledBooking
from ..utils.response_utils import api_success, api_error
from ..utils.crypto_utils import (
    decrypt_phone,
    decrypt_phone_normalized,
    format_phone,
    compute_phone_hash,
)

from django.utils import timezone


# ============================================================
# ВСПОМОГАТЕЛЬНОЕ
# ============================================================


def _collect_clients(master, only_confirmed=False):
    """
    Собирает список клиентов мастера.

    Оптимизация: используем phone_hash для группировки (без расшифровки
    каждой записи). Расшифровываем телефон один раз на клиента.

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

    # Группируем по phone_hash. Для каждой группы — расшифровываем
    # телефон первой записи (один раз), чтобы получить phone_raw.
    # Записи без phone_hash (старые, до миграции) обрабатываем отдельно:
    # для них расшифровка — единственный путь.
    by_hash = defaultdict(list)
    no_hash = []

    for booking in bookings:
        if booking.phone_hash:
            by_hash[booking.phone_hash].append(booking)
        else:
            no_hash.append(booking)

    # Обрабатываем группы с phone_hash
    for phone_hash, group in by_hash.items():
        # Расшифровка — один раз на группу (из первой записи)
        first = group[0]
        phone_cleaned = decrypt_phone_normalized(first.encrypted_phone, key)
        if not phone_cleaned:
            # Не удалось расшифровать — пропускаем всю группу.
            # (Такое возможно только для «битых» записей.)
            continue

        client_key = phone_hash  # используем хеш как ключ группы
        clients_data[client_key]['phone'] = format_phone(phone_cleaned)
        clients_data[client_key]['phone_raw'] = phone_cleaned

        for booking in group:
            _accumulate_client_booking(
                clients_data[client_key], booking, today,
            )

    # Обрабатываем записи без phone_hash (старые данные)
    for booking in no_hash:
        phone_cleaned = decrypt_phone_normalized(booking.encrypted_phone, key)
        if not phone_cleaned:
            continue
        client_key = phone_cleaned
        if not clients_data[client_key]['phone']:
            clients_data[client_key]['phone'] = format_phone(phone_cleaned)
            clients_data[client_key]['phone_raw'] = phone_cleaned
        _accumulate_client_booking(clients_data[client_key], booking, today)

    # Добавляем клиентов из ЧС, которых нет в списке
    blacklisted = BlacklistedClient.objects.filter(master=master)
    for bl in blacklisted:
        # Проверяем, есть ли уже такой клиент по phone_hash
        bl_hash = compute_phone_hash(bl.phone, key)
        present = False
        if bl_hash and bl_hash in clients_data:
            present = True
        elif bl.phone in clients_data:
            present = True

        if not present:
            # Добавляем как отдельного клиента
            clients_data[bl.phone] = {
                'names': {bl.name or 'Без имени'},
                'phone': format_phone(bl.phone),
                'phone_raw': bl.phone,
                'total_visits': 0,
                'services': defaultdict(int),
                'last_visit': None,
                'first_visit': None,
            }

    blacklisted_phones = set(blacklisted.values_list('phone', flat=True))

    return clients_data, blacklisted_phones


def _accumulate_client_booking(client, booking, today):
    """
    Накапливает данные записи в клиента (визиты, услуги, даты).
    Вынесено из _collect_clients для читаемости.
    """
    client['names'].add(booking.client_name)

    # «Визит» = confirmed + дата в прошлом (или сегодня)
    if booking.status == 'confirmed' and booking.date <= today:
        client['total_visits'] += 1

    # Услуги — только по подтверждённым
    if booking.status == 'confirmed':
        service_name = booking.service.name
        if booking.service.category:
            service_name = f"{booking.service.category.name}: {service_name}"
        client['services'][service_name] += 1

        if client['first_visit'] is None or booking.date < client['first_visit']:
            client['first_visit'] = booking.date
        if client['last_visit'] is None or booking.date > client['last_visit']:
            client['last_visit'] = booking.date


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

    # Нормализуем запрос:
    # - search_term — для поиска по имени
    # - search_digits — только цифры, для поиска по телефону
    search_term = query.lower()
    search_digits = re.sub(r'\D', '', query)

    # Варианты цифр для поиска в phone_raw (там номер в формате '79991234567'):
    digits_variants = set()
    if search_digits:
        digits_variants.add(search_digits)

        # Если начинается с 8 — добавим вариант с 7 (старый формат)
        if search_digits.startswith('8'):
            digits_variants.add('7' + search_digits[1:])

        # Если 10 цифр (без ведущей 7/8) — добавим 7 в начало
        if len(search_digits) == 10:
            digits_variants.add('7' + search_digits)

        # Если 11 цифр, начинается с 8 — заменим 8 на 7
        if len(search_digits) == 11 and search_digits.startswith('8'):
            digits_variants.add('7' + search_digits[1:])

    results = []

    for client_key, data in clients_data.items():
        names_list = sorted(data['names'])
        all_names_str = ' '.join(names_list).lower()
        phone_raw = data['phone_raw']

        # Проверяем по имени
        name_match = search_term in all_names_str

        # Проверяем по телефону: хотя бы один из вариантов цифр должен быть в phone_raw
        phone_match = False
        if search_digits:
            for variant in digits_variants:
                if variant and variant in phone_raw:
                    phone_match = True
                    break

        if name_match or phone_match:
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

        decrypted = decrypt_phone(booking.encrypted_phone, key)
        phone_cleaned = re.sub(r'\D', '', decrypted)
        return api_success({'phone': format_phone(phone_cleaned)})

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

        # Отменяем все будущие записи этого клиента.
        # Используем phone_hash для быстрого поиска (O(1) по индексу).
        today = date.today()
        key = master.get_encryption_key()
        phone_hash = compute_phone_hash(phone_cleaned, key)

        cancelled_count = 0

        if phone_hash:
            future_bookings = Booking.objects.filter(
                master=master,
                date__gte=today,
                status='confirmed',
                phone_hash=phone_hash,
            )

            for booking in future_bookings:
                # Сохраняем в CancelledBooking
                CancelledBooking.objects.create(
                    master=master,
                    service=booking.service,
                    client_name=booking.client_name,
                    encrypted_phone=bytes(booking.encrypted_phone),
                    client_comment=booking.client_comment,
                    date=booking.date,
                    time=booking.time,
                    cancelled_by='blacklist',
                    reason=f'Клиент добавлен в ЧС: {reason}',
                    original_booking_id=booking.id,
                )
                # Удаляем оригинальную запись
                booking.delete()
                cancelled_count += 1

        return api_success({
            'created': created,
            'cancelled_count': cancelled_count,
            'client': {
                'id': obj.id,
                'phone': obj.phone,
                'name': obj.name,
                'reason': obj.reason,
                'created_at': timezone.localtime(obj.created_at).strftime('%d.%m.%Y %H:%M'),
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
        'created_at': timezone.localtime(c.created_at).strftime('%d.%m.%Y %H:%M'),
    } for c in clients]

    return JsonResponse({'blacklist': data})