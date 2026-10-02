"""
Чат поддержки.
"""
import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from ..models import SupportMessage
from ..utils.response_utils import api_success, api_error


@login_required
def get_support_messages(request):
    """Возвращает все сообщения чата мастера с поддержкой."""
    master = request.user.master
    messages_qs = SupportMessage.objects.filter(master=master)
    
    # Считаем непрочитанные (от админа)
    unread_count = messages_qs.filter(direction='admin', is_read=False).count()
    
    # Отмечаем все сообщения от админа как прочитанные
    messages_qs.filter(direction='admin', is_read=False).update(is_read=True)
    
    data = []
    for msg in messages_qs:
        data.append({
            'id': msg.id,
            'direction': msg.direction,
            'message': msg.message,
            'created_at': msg.created_at.strftime('%H:%M %d.%m.%Y'),
        })
    
    return JsonResponse({
        'success': True,
        'messages': data,
        'unread_count': unread_count,
    })


@login_required
@require_http_methods(["POST"])
def send_support_message(request):
    """Отправляет сообщение мастера в поддержку."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        message = data.get('message', '').strip()
        
        if not message:
            return api_error('Сообщение не может быть пустым', status=400)
        
        SupportMessage.objects.create(
            master=master,
            direction='user',
            message=message.strip(),
            is_read=False
        )
        
        return api_success({'message': 'Сообщение отправлено'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при отправке сообщения', status=500)


@login_required
def get_unread_support_count(request):
    """Возвращает количество непрочитанных ответов от поддержки."""
    master = request.user.master
    unread_count = SupportMessage.objects.filter(
        master=master, 
        direction='admin', 
        is_read=False
    ).count()
    
    return JsonResponse({'unread_count': unread_count})