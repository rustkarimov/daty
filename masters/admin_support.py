"""
Админка: кастомный раздел «Чат с мастерами».
"""
from django.contrib import admin
from django.http import JsonResponse
from django.shortcuts import redirect, get_object_or_404
from django.template.response import TemplateResponse
from django.urls import path
from django.utils.safestring import mark_safe

from .models import Master, SupportMessage


# ============================================================
# ВСПОМОГАТЕЛЬНОЕ
# ============================================================

def _get_masters_data():
    """Общая логика сбора данных о мастерах с непрочитанными."""
    masters = Master.objects.all()
    masters_data = []

    for master in masters:
        last_msg = SupportMessage.objects.filter(master=master).order_by('-created_at').first()
        unread_count = SupportMessage.objects.filter(
            master=master, direction='user', is_read=False
        ).count()

        masters_data.append({
            'id': master.id,
            'name': master.first_name or master.user.phone,
            'last_name': master.last_name or '',
            'phone': master.user.phone,
            'last_message': last_msg.message[:50] if last_msg else None,
            'last_message_time': last_msg.created_at if last_msg else None,
            'unread_count': unread_count,
        })

    # Сортировка: сначала с непрочитанными, потом по свежести
    masters_data.sort(key=lambda x: (
        -x['unread_count'],
        -(x['last_message_time'].timestamp() if x['last_message_time'] else 0)
    ))

    return masters_data


# ============================================================
# VIEWS
# ============================================================

def support_chat_view(request):
    """Страница чата поддержки в админке."""
    masters_data = _get_masters_data()

    selected_master_id = request.GET.get('master_id')
    selected_master = None
    messages_list = []

    if selected_master_id:
        selected_master = get_object_or_404(Master, id=selected_master_id)
        messages_list = SupportMessage.objects.filter(
            master=selected_master
        ).order_by('created_at')

    if request.method == 'POST' and selected_master:
        reply_text = request.POST.get('reply_text', '').strip()
        if reply_text:
            SupportMessage.objects.create(
                master=selected_master,
                direction='admin',
                message=reply_text,
                is_read=False,
            )
            return redirect(f'/admin/support-chat/?master_id={selected_master.id}')

    context = {
        'masters_data': masters_data,
        'selected_master': selected_master,
        'messages': messages_list,
        'title': 'Чат поддержки',
    }
    return TemplateResponse(request, 'admin/support_chat.html', context)


def get_messages_api(request):
    """API: сообщения конкретного мастера."""
    master_id = request.GET.get('master_id')
    if not master_id:
        return JsonResponse({'success': False, 'error': 'master_id required'})

    master = get_object_or_404(Master, id=master_id)
    messages = SupportMessage.objects.filter(master=master).order_by('created_at')

    data = [{
        'direction': msg.direction,
        'message': msg.message,
        'created_at': msg.created_at.strftime('%d.%m.%Y %H:%M'),
        'is_read': msg.is_read,
    } for msg in messages]

    return JsonResponse({'success': True, 'messages': data})


def get_masters_data_api(request):
    """API: список мастеров с непрочитанными."""
    return JsonResponse({'success': True, 'masters': _get_masters_data()})


def mark_messages_read(request):
    """API: отметить сообщения мастера прочитанными."""
    master_id = request.GET.get('master_id')
    if master_id:
        SupportMessage.objects.filter(
            master_id=master_id, direction='user', is_read=False
        ).update(is_read=True)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})


def get_unread_count(request):
    """API: общее количество непрочитанных."""
    unread_count = SupportMessage.objects.filter(direction='user', is_read=False).count()
    return JsonResponse({'unread_count': unread_count})


# ============================================================
# URLS: добавляем в админку
# ============================================================

_original_get_urls = admin.site.get_urls


def get_admin_urls():
    # Вызываем оригинальный метод ЛЕНИВО — в момент, когда Django
    # формирует URLs админки (а не на этапе импорта модуля)
    return [
        path('support-chat/', admin.site.admin_view(support_chat_view), name='support-chat'),
        path('support-chat/messages/', admin.site.admin_view(get_messages_api), name='support-chat-messages'),
        path('support-chat/masters-data/', admin.site.admin_view(get_masters_data_api), name='support-chat-masters'),
        path('support-chat/mark-read/', admin.site.admin_view(mark_messages_read), name='support-chat-mark-read'),
        path('support-chat/unread-count/', admin.site.admin_view(get_unread_count), name='support-chat-unread'),
    ] + _original_get_urls()


admin.site.get_urls = get_admin_urls


# ============================================================
# CustomAdminSite: пункт меню «Чат с мастерами» с бейджем
# ============================================================

from django.contrib.admin import AdminSite


class CustomAdminSite(AdminSite):
    def get_app_list(self, request):
        app_list = super().get_app_list(request)

        unread_count = SupportMessage.objects.filter(
            direction='user', is_read=False
        ).count()

        if unread_count > 0:
            name = mark_safe(
                f'Чат с мастерами '
                f'<span style="background:#dc3545;color:white;border-radius:50%;'
                f'padding:1px 8px;font-size:10px;margin-left:6px;display:inline-block;'
                f'line-height:1.6;font-weight:bold;">{unread_count}</span>'
            )
        else:
            name = 'Чат с мастерами'

        support_app = {
            'name': 'Поддержка',
            'app_label': 'support',
            'models': [{
                'name': name,
                'object_name': 'SupportChat',
                'admin_url': '/admin/support-chat/',
                'view_only': True,
            }],
        }

        app_list.insert(0, support_app)
        return app_list


# Применяем кастомный AdminSite
admin.site.__class__ = CustomAdminSite