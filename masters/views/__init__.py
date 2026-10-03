"""
Views для приложения masters.

"""


from .main import home, service_worker

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

from .bookings import (  
    add_manual_booking,
    get_booking_slots_for_master,
    get_booking_for_edit,
    api_update_booking,
    api_delete_booking,
)

from .dashboard import (
    dashboard,
    get_calendar_schedule,
    get_bookings_api,
    get_booking_details,
    api_confirm_booking,
    api_unconfirm_booking,
    get_bookings_counts,
    get_bookings_by_date,
    get_day_status,
)

from .public import (
    get_available_dates,
    get_available_slots,
    create_booking,
    create_multiple_bookings,
    master_by_id,
    master_by_login,
)

from .client_api import ( 
    client_booking_view,
    api_client_get_booking,
    api_client_get_slots,
    api_client_cancel_booking,
    api_client_update_booking,
    api_client_check_phone,
    api_client_request_call,
    api_client_check_call,
    my_bookings_view,
)


from .clients import (  # noqa
    clients_statistics,
    get_clients_statistics_api,
    search_clients_api,
    get_decrypted_phone,
    api_blacklist_add,
    api_blacklist_delete,
)