"""
Профиль мастера: редактирование, загрузка аватара.
"""
import json
import os
import re
from datetime import datetime
from io import BytesIO

from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.files.base import ContentFile
from django.views.decorators.http import require_http_methods
from PIL import Image

from ..models import Master


# ============================================================
# СТРАНИЦА
# ============================================================

@login_required
def profile(request):
    """
    Страница профиля. Данные передаются в React через data-атрибуты.
    POST сюда больше не идёт — используется api_profile_update.
    """
    try:
        master = request.user.master
    except Master.DoesNotExist:
        master = Master.objects.create(user=request.user)
    
    return render(request, 'masters/profile.html', {'master': master})


# ============================================================
# API: СОХРАНЕНИЕ ПРОФИЛЯ
# ============================================================

@login_required
@require_http_methods(["POST"])
def api_profile_update(request):
    """
    Сохраняет данные профиля мастера.
    POST /api/profile/update/
    Body: JSON { first_name, last_name, login, address, bio }
    """
    try:
        try:
            master = request.user.master
        except Master.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Мастер не найден'}, status=404)
        
        data = json.loads(request.body)
        
        first_name = (data.get('first_name') or '').strip()
        last_name = (data.get('last_name') or '').strip()
        bio = (data.get('bio') or '').strip()
        address = (data.get('address') or '').strip()
        new_login = (data.get('login') or '').strip()
        
        # Валидация логина
        if new_login and new_login != (master.login or ''):
            if len(new_login) < 3:
                return JsonResponse({
                    'success': False,
                    'error': 'Логин должен содержать минимум 3 символа'
                }, status=400)
            
            if not re.match(r'^[a-zA-Z0-9_-]+$', new_login):
                return JsonResponse({
                    'success': False,
                    'error': 'Логин может содержать только латиницу, цифры, дефис и подчеркивание'
                }, status=400)
            
            if new_login.lower().startswith('id'):
                return JsonResponse({
                    'success': False,
                    'error': 'Логин не может начинаться с "id"'
                }, status=400)
            
            if Master.objects.exclude(pk=master.pk).filter(login=new_login).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Этот логин уже занят'
                }, status=409)
            
            master.login = new_login
        elif not new_login:
            master.login = None
        
        master.first_name = first_name
        master.last_name = last_name
        master.bio = bio
        master.address = address
        master.save()
        
        # Обновляем User
        user = request.user
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        
        return JsonResponse({
            'success': True,
            'master': {
                'first_name': master.first_name,
                'last_name': master.last_name,
                'login': master.login or '',
                'bio': master.bio,
                'address': master.address,
                'public_slug': master.public_slug,
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Неверный формат данных'}, status=400)
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception(f'Ошибка в api_profile_update: {e}')
        return JsonResponse({'success': False, 'error': 'Ошибка при сохранении'}, status=500)


# ============================================================
# API: ЗАГРУЗКА АВАТАРА
# ============================================================

@login_required
def upload_avatar(request):
    """Загружает и сжимает аватар мастера в WebP (300x300)."""
    if request.method == 'POST' and request.FILES.get('avatar'):
        master = request.user.master
        avatar_file = request.FILES['avatar']
        
        try:
            img = Image.open(avatar_file)
        except Exception:
            return JsonResponse({'error': 'Неверный формат изображения'}, status=400)
        
        if img.mode not in ('RGBA', 'P'):
            if img.mode != 'RGB':
                img = img.convert('RGB')
        
        max_size = (300, 300)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        buffer = BytesIO()
        img.save(
            buffer,
            format='WEBP',
            quality=80,
            method=6,
            lossless=False,
        )
        buffer.seek(0)
        
        filename = f"avatar_{master.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.webp"
        
        if master.avatar:
            old_path = master.avatar.path
            if os.path.isfile(old_path):
                os.remove(old_path)
        
        master.avatar.save(filename, ContentFile(buffer.getvalue()), save=True)
        
        return JsonResponse({
            'success': True,
            'avatar_url': master.avatar.url,
        })
    
    return JsonResponse({'error': 'Неверный запрос'}, status=400)