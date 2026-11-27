"""
Чат поддержки.
"""
import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from ..models import SupportMessage
from ..utils.response_utils import api_success, api_error
from django.utils import timezone


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
            'image_url': msg.image.url if msg.image else None,
            'created_at': timezone.localtime(msg.created_at).strftime('%H:%M %d.%m.%Y'),
        })
    
    return JsonResponse({
        'success': True,
        'messages': data,
        'unread_count': unread_count,
    })


@login_required
@require_http_methods(["POST"])
def send_support_message(request):
    """Отправляет сообщение мастера в поддержку (с возможностью прикрепить фото)."""
    try:
        master = request.user.master
        
        # Теперь мы принимаем FormData, а не JSON
        message = request.POST.get('message', '').strip()
        image_file = request.FILES.get('image')

        if not message and not image_file:
            return api_error('Сообщение не может быть пустым', status=400)

        support_msg = SupportMessage.objects.create(
            master=master,
            direction='user',
            message=message or ' ',
            image=image_file,
            is_read=False,
        )
        
        return api_success({'message': 'Сообщение отправлено'})
        
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception(f'Ошибка отправки в поддержку: {e}')
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


@login_required
@require_http_methods(["POST"])
def delete_support_message(request, message_id):
    """Удаляет сообщение мастера из чата."""
    try:
        master = request.user.master
        # Мастер может удалять ТОЛЬКО свои сообщения
        msg = SupportMessage.objects.filter(id=message_id, master=master, direction='user').first()
        
        if not msg:
            return api_error('Сообщение не найдено или недоступно для удаления', status=404)
            
        # Удаляем файл картинки с диска, если он есть (чтобы не копился мусор)
        if msg.image:
            msg.image.delete(save=False)
            
        msg.delete()
        return api_success({'message': 'Сообщение удалено'})
        
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception(f'Ошибка удаления сообщения: {e}')
        return api_error('Ошибка при удалении', status=500)