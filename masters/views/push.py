"""
Push-уведомления: подписка, отписка, проверка, VAPID-ключ.
"""
import os
import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from ..models import PushSubscription
from ..utils.response_utils import api_success, api_error


@login_required
@require_http_methods(["POST"])
def api_push_subscribe(request):
    """Сохраняет push-подписку мастера (создаёт или обновляет)."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        endpoint = data.get('endpoint')
        keys = data.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')
        
        if not endpoint or not p256dh or not auth:
            return api_error('Неверные данные подписки', status=400)
        
        # update_or_create — если endpoint уже есть, обновим
        sub, created = PushSubscription.objects.update_or_create(
            master=master,
            endpoint=endpoint,
            defaults={
                'p256dh': p256dh,
                'auth': auth,
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:255],
            }
        )
        
        return api_success({'created': created})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error(f'Ошибка: {str(e)}', status=500)


@login_required
@require_http_methods(["POST"])
def api_push_unsubscribe(request):
    """Удаляет push-подписку мастера по endpoint."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        endpoint = data.get('endpoint')
        
        if not endpoint:
            return api_error('Endpoint не указан', status=400)
        
        deleted, _ = PushSubscription.objects.filter(
            master=master, endpoint=endpoint
        ).delete()
        
        return api_success({'deleted': deleted})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error(f'Ошибка: {str(e)}', status=500)


@login_required
def api_push_vapid_public_key(request):
    """Возвращает публичный VAPID-ключ для подписки на push."""
    return api_success({
        'publicKey': os.getenv('VAPID_PUBLIC_KEY', '')
    })


@login_required
@require_http_methods(["POST"])
def api_push_check(request):
    """Проверяет, есть ли у мастера подписка с таким endpoint."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        endpoint = data.get('endpoint')
        
        if not endpoint:
            return api_error('Endpoint не указан', status=400)
        
        exists = PushSubscription.objects.filter(
            master=master, endpoint=endpoint
        ).exists()
        
        return api_success({'exists': exists})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error(f'Ошибка: {str(e)}', status=500)