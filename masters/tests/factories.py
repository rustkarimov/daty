"""
Фабрики для создания тестовых данных.

Использование:
    from .factories import create_master, create_service, create_schedule, get_next_monday
    
    master = create_master()
    service = create_service(master)
    create_schedule(master)
    test_date = get_next_monday()
"""
from datetime import date, time, timedelta
from ..models import CustomUser, Master, Service, Schedule


# ============================================================
# ПОЛЬЗОВАТЕЛИ И МАСТЕРА
# ============================================================

def create_user(phone='79991234567', password='testpass123', **kwargs):
    """Создаёт пользователя CustomUser"""
    return CustomUser.objects.create_user(
        phone=phone,
        password=password,
        **kwargs
    )


def create_master(phone='79991234567', first_name='Иван', last_name='Иванов', **kwargs):
    """
    Создаёт мастера с пользователем.
    Если пользователь с таким phone уже существует — использует его.
    """
    user, _ = CustomUser.objects.get_or_create(
        phone=phone,
        defaults={'first_name': first_name, 'last_name': last_name}
    )
    
    master, _ = Master.objects.get_or_create(
        user=user,
        defaults={
            'phone': phone,
            'first_name': first_name,
            'last_name': last_name,
            **kwargs
        }
    )
    return master


# ============================================================
# УСЛУГИ
# ============================================================

def create_service(master, name='Маникюр', duration=60, price=1500, **kwargs):
    """Создаёт услугу для мастера"""
    return Service.objects.create(
        master=master,
        name=name,
        duration=duration,
        price=price,
        is_active=True,
        **kwargs
    )


# ============================================================
# РАСПИСАНИЕ
# ============================================================

def create_schedule(master, days=None, start=time(9, 0), end=time(18, 0)):
    """
    Создаёт расписание для мастера.
    
    Args:
        master: мастер
        days: список дней недели (0=Пн, 6=Вс). По умолчанию — будни (0-4)
        start: время начала работы
        end: время окончания работы
    """
    if days is None:
        days = range(5)  # Пн-Пт по умолчанию
    
    schedules = []
    for day in days:
        schedule = Schedule.objects.create(
            master=master,
            day_of_week=day,
            start_time=start,
            end_time=end
        )
        schedules.append(schedule)
    return schedules


# ============================================================
# ДАТЫ
# ============================================================

def get_next_monday():
    """Возвращает дату следующего понедельника (не сегодня)"""
    today = date.today()
    days_ahead = (0 - today.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return today + timedelta(days=days_ahead)


def get_next_sunday():
    """Возвращает дату следующего воскресенья (не сегодня)"""
    today = date.today()
    days_ahead = (6 - today.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return today + timedelta(days=days_ahead)


def get_past_date(days_ago=1):
    """Возвращает дату в прошлом"""
    return date.today() - timedelta(days=days_ago)