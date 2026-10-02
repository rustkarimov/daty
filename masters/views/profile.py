"""
Профиль мастера: редактирование, загрузка аватара.
"""
import os
from datetime import datetime
from io import BytesIO

from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.files.base import ContentFile
from PIL import Image

from ..models import Master


@login_required
def profile(request):
    """Показывает и сохраняет страницу профиля мастера."""
    try:
        master = request.user.master
    except Master.DoesNotExist:
        master = Master.objects.create(user=request.user)
    
    if request.method == 'POST':
        # Обновляем данные мастера
        master.first_name = request.POST.get('first_name', '')
        master.last_name = request.POST.get('last_name', '')
        master.bio = request.POST.get('bio', '')
        
        # Обновляем логин
        new_login = request.POST.get('login', '').strip()
        if new_login != (master.login or ''):
            import re
            if new_login:
                # Проверка длины
                if len(new_login) < 3:
                    messages.error(request, 'Логин должен содержать минимум 3 символа')
                    return redirect('profile')
                
                # Проверка допустимых символов
                if not re.match(r'^[a-zA-Z0-9_-]+$', new_login):
                    messages.error(request, 'Логин может содержать только латиницу, цифры, дефис и подчеркивание')
                    return redirect('profile')
                
                # Проверка: логин не должен начинаться с 'id'
                if new_login.lower().startswith('id'):
                    messages.error(request, 'Логин не может начинаться с "id"')
                    return redirect('profile')
                
                # Проверка уникальности
                if Master.objects.exclude(pk=master.pk).filter(login=new_login).exists():
                    messages.error(request, 'Этот логин уже занят')
                    return redirect('profile')
                
                master.login = new_login
            else:
                master.login = None
            messages.success(request, 'Логин сохранен! Ваша ссылка обновлена.')
        
        master.save()
        
        # Обновляем имя в User (только first_name и last_name)
        user = request.user
        user.first_name = master.first_name
        user.last_name = master.last_name
        user.save()
        
        return redirect('profile')
    
    return render(request, 'masters/profile.html', {'master': master})


@login_required
def upload_avatar(request):
    """Загружает и сжимает аватар мастера в WebP (300x300)."""
    if request.method == 'POST' and request.FILES.get('avatar'):
        master = request.user.master
        avatar_file = request.FILES['avatar']
        
        # Открываем изображение (любой формат)
        try:
            img = Image.open(avatar_file)
        except Exception:
            return JsonResponse({'error': 'Неверный формат изображения'}, status=400)
        
        # Конвертируем в RGB если нужно (для PNG с прозрачностью)
        if img.mode in ('RGBA', 'P'):
            # Сохраняем прозрачность для WebP
            pass  # WebP поддерживает прозрачность, не конвертируем
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Сжимаем до 300x300
        max_size = (300, 300)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Сохраняем в буфер в формате WebP
        buffer = BytesIO()
        img.save(
            buffer,
            format='WEBP',
            quality=80,      # Хорошее качество
            method=6,        # Максимальное сжатие
            lossless=False   # С потерями (для фото)
        )
        buffer.seek(0)
        
        # Формируем имя файла
        filename = f"avatar_{master.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.webp"
        
        # Удаляем старый аватар, если есть
        if master.avatar:
            old_path = master.avatar.path
            if os.path.isfile(old_path):
                os.remove(old_path)
        
        # Сохраняем новый аватар
        master.avatar.save(filename, ContentFile(buffer.getvalue()), save=True)
        
        return JsonResponse({
            'success': True,
            'avatar_url': master.avatar.url
        })
    
    return JsonResponse({'error': 'Неверный запрос'}, status=400)