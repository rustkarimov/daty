"""
Views для приложения masters.

ВРЕМЕННО: реэкспорт из старого views_old.py.
По мере переноса модулей эта строка будет заменена на конкретные импорты.
"""
from ..views_old import *  



from .policies import privacy_policy, terms_of_service, agree
from .notifications import (
    get_notifications,
    mark_notification_read,
    mark_all_read,
    mark_notification_unread,
)
