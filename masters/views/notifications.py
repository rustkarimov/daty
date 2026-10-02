"""
Уведомления мастера.
"""
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required

from ..models import Notification


@login_required
def get_notifications(request):
    """Возвращает список уведомлений мастера с пагинацией."""
    master = request.user.master
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))
    
    notifications = Notification.objects.filter(master=master)
    total = notifications.count()
    unread = notifications.filter(is_read=False).count()
    notifications_list = notifications[offset:offset+limit]
    
    data = [{
        'id': n.id,
        'type': n.type,
        'title': n.title,
        'message': n.message,
        'is_read': n.is_read,
        'created_at': n.created_at.strftime('%d.%m.%Y %H:%M'),
    } for n in notifications_list]
    
    return JsonResponse({
        'notifications': data,
        'total': total,
        'unread': unread,
        'has_more': offset + limit < total
    })


@login_required
def mark_notification_read(request, notification_id):
    """Отмечает конкретное уведомление как прочитанное."""
    notification = get_object_or_404(Notification, id=notification_id, master=request.user.master)
    notification.is_read = True
    notification.save()
    return JsonResponse({'success': True})


@login_required
def mark_all_read(request):
    """Отмечает все уведомления мастера как прочитанные."""
    Notification.objects.filter(master=request.user.master, is_read=False).update(is_read=True)
    return JsonResponse({'success': True})


@login_required
def mark_notification_unread(request, notification_id):
    """Отмечает конкретное уведомление как непрочитанное."""
    notification = get_object_or_404(Notification, id=notification_id, master=request.user.master)
    notification.is_read = False
    notification.save()
    return JsonResponse({'success': True})