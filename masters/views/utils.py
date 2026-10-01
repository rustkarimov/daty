"""
Вспомогательные утилиты для views.
"""


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