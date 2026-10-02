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
from .support import ( 
    get_support_messages,
    send_support_message,
    get_unread_support_count,
)
from .push import (  
    api_push_subscribe,
    api_push_unsubscribe,
    api_push_vapid_public_key,
    api_push_check,
)

from .profile import profile, upload_avatar

from .auth import (
    mobile_login,
    mobile_register,
    mobile_verify,
    mobile_resend_code,
    request_reset_call,
    check_reset_call_status,
    reset_password_confirm,
    logout_view,
)

from .services import (
    services,
    api_add_service,
    api_edit_service,
    api_delete_service,
    get_categories,
    api_add_category,
    api_edit_category,
    api_delete_category,
    api_get_service,
    get_master_categories,
)

from .schedule import (  
    # Регулярное расписание
    schedule,
    delete_schedule,
    api_add_schedule,
    api_edit_schedule,
    api_delete_schedule,
    # Дополнительные рабочие дни
    api_add_extra_day,
    api_delete_extra_day,
    api_delete_extra_day_by_date,
    get_extra_days_upcoming,
    get_extra_days_past,
    # Выходные
    get_days_off_list,
    api_add_day_off,
    api_delete_day_off,
    api_delete_day_off_by_date,
)

