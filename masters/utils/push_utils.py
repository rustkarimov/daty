import os
import json
from pywebpush import webpush, WebPushException
from ..models import PushSubscription

from django.conf import settings


def send_push_to_master(master, title, body, url='/dashboard/', tag=None):
    """
    Отправляет push-уведомление мастеру.
    
    Args:
        master: объект Master
        title: заголовок уведомления (до 50 символов)
        body: текст уведомления (до 150 символов)
        url: URL, куда открыть при клике
        tag: тег для группировки уведомлений (опционально)
    
    Returns:
        dict: {'sent': N, 'failed': M, 'deleted': K}
    """
    vapid_private_key_path = os.path.join(settings.BASE_DIR, 'secrets', 'vapid_private.pem')
    vapid_admin_email = os.getenv('VAPID_ADMIN_EMAIL', 'mailto:noreply@daty.pro')
    
    if not vapid_private_key_path:
        print('❌ VAPID_PRIVATE_KEY не задан')
        return {'sent': 0, 'failed': 0, 'deleted': 0}
    
    # Формируем sub для VAPID
    if not vapid_admin_email.startswith('mailto:'):
        vapid_admin_email = f'mailto:{vapid_admin_email}'
    
    subscriptions = PushSubscription.objects.filter(master=master)
    
    sent = 0
    failed = 0
    deleted = 0
    
    for sub in subscriptions:
        try:
            subscription_info = {
                'endpoint': sub.endpoint,
                'keys': {
                    'p256dh': sub.p256dh,
                    'auth': sub.auth,
                }
            }
            
            payload = json.dumps({
                'title': title,
                'body': body,
                'url': url,
                'tag': tag or 'daty-notification',
            })
            
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=vapid_private_key_path,
                vapid_claims={'sub': vapid_admin_email}
            )
            sent += 1
            print(f'✅ Push отправлен: {sub.endpoint[:60]}...')
            
        except WebPushException as e:
            # 404 / 410 — подписка устарела, удаляем
            if e.response and e.response.status_code in (404, 410):
                print(f'🗑️ Подписка устарела, удаляем: {sub.endpoint[:60]}...')
                sub.delete()
                deleted += 1
            else:
                print(f'❌ Ошибка push: {e}')
                failed += 1
        except Exception as e:
            print(f'❌ Неожиданная ошибка push: {e}')
            failed += 1
    
    return {'sent': sent, 'failed': failed, 'deleted': deleted}