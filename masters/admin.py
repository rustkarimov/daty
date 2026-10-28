"""
Админка приложения masters.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    CustomUser,
    Master,
    Service,
    Schedule,
    DayOff,
    Booking,
    PhoneVerification,
    Notification,
    CancelledBooking,
)

# Импортируем регистрацию чата поддержки
from . import admin_support  # noqa: F401


# ============================================================
# ПОЛЬЗОВАТЕЛИ
# ============================================================

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('phone', 'first_name', 'last_name', 'is_staff')
    search_fields = ('phone', 'first_name', 'last_name')
    ordering = ('phone',)

    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'password1', 'password2'),
        }),
    )


# ============================================================
# МАСТЕРА
# ============================================================

@admin.register(Master)
class MasterAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'public_slug', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__phone', 'phone', 'first_name', 'last_name', 'login']
    readonly_fields = ['encryption_key', 'created_at', 'updated_at']

    fields = [
        'user', 'phone', 'first_name', 'last_name', 'bio', 'login',
        'work_mode',
        'away_travel_time_before_default', 'away_travel_time_after_default', 'arrival_window_minutes',
        'min_booking_lead_time', 'home_buffer_between_bookings',
        'encryption_key', 'created_at', 'updated_at',
    ]

    def full_name(self, obj):
        return obj.__str__()
    full_name.short_description = "Имя мастера"

    def public_slug(self, obj):
        return obj.public_slug
    public_slug.short_description = "Ссылка"


# ============================================================
# УСЛУГИ
# ============================================================

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'master', 'duration', 'price', 'is_active']
    list_filter = ['master', 'is_active']
    search_fields = ['name', 'master__first_name', 'master__last_name']


# ============================================================
# РАСПИСАНИЕ
# ============================================================

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['master', 'day_of_week', 'start_time', 'end_time']
    list_filter = ['master']


@admin.register(DayOff)
class DayOffAdmin(admin.ModelAdmin):
    list_display = ['master', 'date', 'reason']
    list_filter = ['master', 'date']


# ============================================================
# ЗАПИСИ
# ============================================================

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'master', 'service', 'date', 'time', 'status']
    list_filter = ['master', 'status', 'date']
    search_fields = ['client_name', 'master__first_name', 'master__last_name']
    readonly_fields = ['encrypted_phone']


@admin.register(CancelledBooking)
class CancelledBookingAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'master', 'date', 'time', 'cancelled_by', 'cancelled_at']
    list_filter = ['cancelled_by', 'cancelled_at', 'master']
    search_fields = ['client_name', 'master__first_name', 'master__last_name']
    readonly_fields = ['cancelled_at', 'encrypted_phone']
    date_hierarchy = 'cancelled_at'


# ============================================================
# ВЕРИФИКАЦИЯ
# ============================================================

@admin.register(PhoneVerification)
class PhoneVerificationAdmin(admin.ModelAdmin):
    list_display = ['phone', 'code', 'created_at', 'is_used']
    list_filter = ['is_used', 'created_at']
    search_fields = ['phone', 'code']
    readonly_fields = ['created_at']


# ============================================================
# УВЕДОМЛЕНИЯ
# ============================================================

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['master', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'master__phone']
    actions = ['send_to_all_masters']

    def send_to_all_masters(self, request, queryset):
        count = 0
        for master in Master.objects.all():
            for notification in queryset:
                Notification.objects.create(
                    master=master,
                    type=notification.type,
                    title=notification.title,
                    message=notification.message,
                )
                count += 1
        self.message_user(request, f'✅ Уведомления отправлены всем мастерам ({count})')
    send_to_all_masters.short_description = '📢 Отправить ВСЕМ мастерам'