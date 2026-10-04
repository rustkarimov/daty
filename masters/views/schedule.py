"""
Расписание работы: регулярное, дополнительные дни, выходные.
"""
import json
from datetime import datetime, date
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from ..models import Schedule, Break, ExtraWorkingDay, ExtraWorkingDayBreak, DayOff, Booking
from ..utils.response_utils import api_success, api_error


# ============================================================
# РЕГУЛЯРНОЕ РАСПИСАНИЕ
# ============================================================

@login_required
def schedule(request):
    """Страница настройки регулярного расписания мастера."""
    master = request.user.master
    schedules = Schedule.objects.filter(master=master).order_by('day_of_week')
    
    return render(request, 'masters/schedule.html', {
        'schedules': schedules,
    })


@login_required
def delete_schedule(request, schedule_id):
    """Удаляет регулярное расписание для конкретного дня недели."""
    schedule = get_object_or_404(Schedule, id=schedule_id, master=request.user.master)
    schedule.delete()
    messages.success(request, 'Расписание удалено')
    return redirect('schedule')


@login_required
@require_http_methods(["POST"])
def api_add_schedule(request):
    """Создаёт регулярное расписание для дня недели (с перерывами)."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        day_of_week = data.get('day_of_week')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        breaks = data.get('breaks', [])
        
        # Валидация обязательных полей
        if day_of_week is None:
            return api_error('Выберите день недели', status=400)
        if not start_time or not end_time:
            return api_error('Укажите время начала и окончания работы', status=400)
        if start_time >= end_time:
            return api_error('Время начала не может быть позже времени окончания', status=400)
        
        # Проверка на дубликат
        if Schedule.objects.filter(master=master, day_of_week=day_of_week).exists():
            return api_error('Расписание для этого дня уже существует', status=409)
        
        # Создаем расписание
        schedule = Schedule.objects.create(
            master=master,
            day_of_week=day_of_week,
            start_time=datetime.strptime(start_time, '%H:%M').time(),
            end_time=datetime.strptime(end_time, '%H:%M').time()
        )
        
        # Добавляем перерывы с проверкой
        for break_data in breaks:
            if break_data.get('start') and break_data.get('end'):
                # Проверка: начало перерыва < конец перерыва
                if break_data['start'] >= break_data['end']:
                    return api_error(
                        f'Перерыв {break_data["start"]}-{break_data["end"]}: время начала не может быть позже окончания',
                        status=400
                    )
                # Проверка: перерыв в пределах рабочего дня
                if break_data['start'] < start_time or break_data['end'] > end_time:
                    return api_error(
                        f'Перерыв {break_data["start"]}-{break_data["end"]} выходит за пределы рабочего дня ({start_time}-{end_time})',
                        status=400
                    )
                Break.objects.create(
                    schedule=schedule,
                    start_time=datetime.strptime(break_data['start'], '%H:%M').time(),
                    end_time=datetime.strptime(break_data['end'], '%H:%M').time()
                )
        
        return api_success({
            'schedule': {
                'id': schedule.id,
                'day_of_week': schedule.day_of_week,
                'day_name': schedule.get_day_of_week_display(),
                'start_time': schedule.start_time.strftime('%H:%M'),
                'end_time': schedule.end_time.strftime('%H:%M'),
                'breaks': [{
                    'start': b.start_time.strftime('%H:%M'),
                    'end': b.end_time.strftime('%H:%M')
                } for b in schedule.breaks.all()]
            }
        })
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат времени: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при добавлении расписания', status=500)


@login_required
@require_http_methods(["POST"])
def api_edit_schedule(request, schedule_id):
    """Редактирует регулярное расписание (время работы и перерывы)."""
    try:
        try:
            schedule = Schedule.objects.get(id=schedule_id, master=request.user.master)
        except Schedule.DoesNotExist:
            return api_error('Расписание не найдено', status=404)
        
        data = json.loads(request.body)
        
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        breaks = data.get('breaks', [])
        
        # Валидация времени
        if start_time and end_time:
            if start_time >= end_time:
                return api_error('Время начала не может быть позже времени окончания', status=400)
            schedule.start_time = datetime.strptime(start_time, '%H:%M').time()
            schedule.end_time = datetime.strptime(end_time, '%H:%M').time()
            schedule.save()
        elif start_time or end_time:
            return api_error('Укажите и начало, и конец работы', status=400)
        
        work_start = schedule.start_time.strftime('%H:%M')
        work_end = schedule.end_time.strftime('%H:%M')
        
        # Проверка пересечения перерывов между собой
        for i in range(len(breaks)):
            for j in range(i + 1, len(breaks)):
                b1 = breaks[i]
                b2 = breaks[j]
                if b1.get('start') and b1.get('end') and b2.get('start') and b2.get('end'):
                    # Преобразуем в объекты времени для корректного сравнения
                    b1_start = datetime.strptime(b1['start'], '%H:%M').time()
                    b1_end = datetime.strptime(b1['end'], '%H:%M').time()
                    b2_start = datetime.strptime(b2['start'], '%H:%M').time()
                    b2_end = datetime.strptime(b2['end'], '%H:%M').time()
                    
                    if b1_start < b2_end and b2_start < b1_end:
                        return api_error(
                            f'Перерывы {b1["start"]}-{b1["end"]} и {b2["start"]}-{b2["end"]} пересекаются между собой',
                            status=400
                        )
        
        # Проверка каждого перерыва на вхождение в рабочий день
        for break_data in breaks:
            if break_data.get('start') and break_data.get('end'):
                if break_data['start'] >= break_data['end']:
                    return api_error(
                        f'Перерыв {break_data["start"]}-{break_data["end"]}: время начала не может быть позже окончания',
                        status=400
                    )
                if break_data['start'] < work_start or break_data['end'] > work_end:
                    return api_error(
                        f'Перерыв {break_data["start"]}-{break_data["end"]} выходит за пределы рабочего дня ({work_start}-{work_end})',
                        status=400
                    )
        
        # Обновляем перерывы
        schedule.breaks.all().delete()
        for break_data in breaks:
            if break_data.get('start') and break_data.get('end'):
                Break.objects.create(
                    schedule=schedule,
                    start_time=datetime.strptime(break_data['start'], '%H:%M').time(),
                    end_time=datetime.strptime(break_data['end'], '%H:%M').time()
                )
        
        return api_success({
            'schedule': {
                'id': schedule.id,
                'day_of_week': schedule.day_of_week,
                'day_name': schedule.get_day_of_week_display(),
                'start_time': schedule.start_time.strftime('%H:%M'),
                'end_time': schedule.end_time.strftime('%H:%M'),
                'breaks': [{
                    'start': b.start_time.strftime('%H:%M'),
                    'end': b.end_time.strftime('%H:%M')
                } for b in schedule.breaks.all()]
            }
        })
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат времени: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при обновлении расписания', status=500)


@login_required
@require_http_methods(["POST"])
def api_delete_schedule(request, schedule_id):
    """Удаляет регулярное расписание через API (AJAX)."""
    try:
        schedule = Schedule.objects.get(id=schedule_id, master=request.user.master)
        schedule.delete()
        return api_success({'message': 'Расписание удалено'})
    except Schedule.DoesNotExist:
        return api_error('Расписание не найдено', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении расписания', status=500)

# ============================================================
# ДОПОЛНИТЕЛЬНЫЕ РАБОЧИЕ ДНИ
# ============================================================
@login_required
@require_http_methods(["POST"])
def api_add_extra_day(request):
    """Добавляет дополнительный рабочий день (вне регулярного расписания)."""
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
        
        # 4. Проверка пересечения перерывов между собой
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
        
        def time_to_minutes(t_str):
            """'14:30' → 870 (минут от начала дня)"""
            h, m = map(int, t_str.split(':'))
            return h * 60 + m
        
        # 5. Проверка: перерывы не должны пересекаться с существующими записями
        # (проверяем ДО удаления ExtraWorkingDay/DayOff, чтобы не сломать данные)
        existing_bookings = Booking.objects.filter(
            master=master,
            date=target_date,
            status='confirmed'
        ).select_related('service')
        
        for break_data in breaks:
            if not break_data.get('start') or not break_data.get('end'):
                continue
            
            b_start = time_to_minutes(break_data['start'])
            b_end = time_to_minutes(break_data['end'])
            
            for booking in existing_bookings:
                booking_start = time_to_minutes(booking.time.strftime('%H:%M'))
                booking_end = booking_start + booking.service.duration
                
                # Пересечение: b_start < booking_end И booking_start < b_end
                if b_start < booking_end and booking_start < b_end:
                    return api_error(
                        f'Перерыв {break_data["start"]}-{break_data["end"]} пересекается '
                        f'с записью клиента "{booking.client_name}" в {booking.time.strftime("%H:%M")}. '
                        f'Сначала перенесите или отмените запись.',
                        status=409
                    )
        
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
@require_http_methods(["POST"])
def api_delete_extra_day(request, extra_day_id):
    """Удаляет дополнительный рабочий день по ID."""
    try:
        extra_day = ExtraWorkingDay.objects.get(id=extra_day_id, master=request.user.master)
        extra_day.delete()
        return api_success({'message': 'Дополнительный рабочий день удален'})
    except ExtraWorkingDay.DoesNotExist:
        return api_error('Дополнительный рабочий день не найден', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении', status=500)


@login_required
@require_http_methods(["POST"])
def api_delete_extra_day_by_date(request):
    """Удаляет дополнительный рабочий день по дате (для AJAX из модалки дня)."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        date_str = data.get('date')
        
        if not date_str:
            return api_error('Дата не указана', status=400)
        
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        ExtraWorkingDay.objects.filter(master=master, date=target_date).delete()
        
        return api_success({'message': 'Дополнительный рабочий день удален'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при удалении дополнительного рабочего дня', status=500)


@login_required
def get_extra_days_upcoming(request):
    """Возвращает список будущих дополнительных рабочих дней."""
    master = request.user.master
    today = date.today()
    
    extra_days = ExtraWorkingDay.objects.filter(
        master=master,
        date__gte=today
    ).order_by('date')
    
    def get_month_name(month_num):
        months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
        return months[month_num - 1]
    
    def get_weekday_name(date_obj):
        weekdays = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
        return weekdays[date_obj.weekday()]
    
    data = []
    for day in extra_days:
        date_obj = day.date
        data.append({
            'id': day.id,
            'date': day.date.strftime('%Y-%m-%d'),
            'date_display': f"{date_obj.day} {get_month_name(date_obj.month)} ({get_weekday_name(date_obj)})",
            'start_time': day.start_time.strftime('%H:%M'),
            'end_time': day.end_time.strftime('%H:%M'),
            'breaks': [{
                'start': b.start_time.strftime('%H:%M'),
                'end': b.end_time.strftime('%H:%M')
            } for b in day.breaks.all()]
        })
    
    return JsonResponse({'future_days': data})


@login_required
def get_extra_days_past(request):
    """Возвращает прошедшие дополнительные рабочие дни с пагинацией."""
    master = request.user.master
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 30))
    offset = (page - 1) * limit
    today = date.today()
    
    extra_days_all = ExtraWorkingDay.objects.filter(
        master=master,
        date__lt=today
    ).order_by('-date')
    
    total = extra_days_all.count()
    has_more = offset + limit < total
    
    extra_days_page = extra_days_all[offset:offset + limit]
    
    def get_month_name(month_num):
        months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
        return months[month_num - 1]
    
    def get_weekday_name(date_obj):
        weekdays = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
        return weekdays[date_obj.weekday()]
    
    data = []
    for day in extra_days_page:
        date_obj = day.date
        data.append({
            'id': day.id,
            'date': day.date.strftime('%Y-%m-%d'),
            'date_display': f"{date_obj.day} {get_month_name(date_obj.month)} ({get_weekday_name(date_obj)})",
            'start_time': day.start_time.strftime('%H:%M'),
            'end_time': day.end_time.strftime('%H:%M'),
            'breaks': [{
                'start': b.start_time.strftime('%H:%M'),
                'end': b.end_time.strftime('%H:%M')
            } for b in day.breaks.all()]
        })
    
    return JsonResponse({
        'past_days': data,
        'total': total,
        'page': page,
        'has_more': has_more
    })


# ============================================================
# ВЫХОДНЫЕ ДНИ
# ============================================================

@login_required
def get_days_off_list(request):
    """Возвращает список будущих выходных дней мастера."""
    master = request.user.master
    today = date.today()
    days_off = DayOff.objects.filter(
        master=master,
        date__gte=today
    ).order_by('date')
    
    def get_month_name(month_num):
        months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ]
        return months[month_num - 1]
    
    def get_weekday_name(date_obj):
        weekdays = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
        return weekdays[date_obj.weekday()]
    
    data = [{
        'id': d.id,
        'date': d.date.strftime('%Y-%m-%d'),
        'date_display': f"{d.date.day} {get_month_name(d.date.month)} ({get_weekday_name(d.date)})",
        'reason': d.reason
    } for d in days_off]
    
    return JsonResponse({'days_off': data})


@login_required
@require_http_methods(["POST"])
def api_add_day_off(request):
    """Добавляет выходной день (проверяет, что день рабочий)."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        date_str = data.get('date')
        reason = data.get('reason', '')
        
        if not date_str:
            return api_error('Выберите дату', status=400)
        
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        day_of_week = target_date.weekday()
        
        # Проверяем, является ли день рабочим
        has_schedule = Schedule.objects.filter(master=master, day_of_week=day_of_week).exists()
        has_extra_day = ExtraWorkingDay.objects.filter(master=master, date=target_date).exists()
        
        # Если день нерабочий — показываем уведомление и НЕ создаем DayOff
        if not has_schedule and not has_extra_day:
            return api_error(
                '🎉 В этот день ты и так не работаешь! Хорошего отдыха!',
                status=400
            )
        
        # Проверяем, не является ли дата уже выходным
        if DayOff.objects.filter(master=master, date=target_date).exists():
            return api_error('Этот день уже отмечен как выходной', status=409)
        
        # Создаём выходной
        DayOff.objects.create(
            master=master,
            date=target_date,
            reason=reason
        )
        
        return api_success({'message': 'Выходной день добавлен'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при добавлении выходного дня', status=500)


@login_required
@require_http_methods(["POST"])
def api_delete_day_off(request, dayoff_id):
    """Удаляет выходной день по ID."""
    try:
        day_off = DayOff.objects.get(id=dayoff_id, master=request.user.master)
        day_off.delete()
        return api_success({'message': 'Выходной день удален'})
    except DayOff.DoesNotExist:
        return api_error('Выходной день не найден', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении выходного дня', status=500)


@login_required
@require_http_methods(["POST"])
def api_delete_day_off_by_date(request):
    """Удаляет выходной день по дате (для AJAX из модалки дня)."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        date_str = data.get('date')
        
        if not date_str:
            return api_error('Дата не указана', status=400)
        
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        DayOff.objects.filter(master=master, date=target_date).delete()
        
        return api_success({'message': 'Выходной день удален'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except ValueError as e:
        return api_error(f'Неверный формат даты: {e}', status=400)
    except Exception as e:
        return api_error('Ошибка при удалении выходного дня', status=500)