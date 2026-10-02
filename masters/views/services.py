"""
Услуги и категории услуг мастера.
"""
import json
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import Http404

from ..models import Service, ServiceCategory
from ..utils.response_utils import api_success, api_error
from ..utils.master_utils import get_master_by_identifier


# ============================================================
# СТРАНИЦА УПРАВЛЕНИЯ УСЛУГАМИ
# ============================================================

@login_required
def services(request):
    """Страница управления услугами"""
    master = request.user.master
    services_list = Service.objects.filter(master=master)
    return render(request, 'masters/services.html', {'services': services_list})


# ============================================================
# API ДЛЯ УСЛУГ
# ============================================================

@login_required
@require_http_methods(["POST"])
def api_add_service(request):
    """Создаёт новую услугу мастера."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        # Валидация
        if not data.get('name'):
            return api_error('Название услуги обязательно', status=400)
        if not data.get('duration'):
            return api_error('Длительность обязательна', status=400)
        if not data.get('price'):
            return api_error('Цена обязательна', status=400)
        
        category_id = data.get('category_id')
        category = None
        if category_id:
            try:
                category = ServiceCategory.objects.get(id=category_id, master=master)
            except ServiceCategory.DoesNotExist:
                return api_error('Категория не найдена', status=404)
        
        service = Service.objects.create(
            master=master,
            category=category,
            name=data.get('name'),
            description=data.get('description', ''),
            duration=data.get('duration'),
            price=data.get('price'),
            is_active=data.get('is_active', True)
        )
        
        return api_success({'service_id': service.id})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при создании услуги', status=500)


@login_required
@require_http_methods(["POST"])
def api_edit_service(request, service_id):
    """Редактирует существующую услугу мастера."""
    try:
        # Проверка существования услуги
        try:
            service = Service.objects.get(id=service_id, master=request.user.master)
        except Service.DoesNotExist:
            return api_error('Услуга не найдена', status=404)
        
        data = json.loads(request.body)
        
        # Валидация обязательных полей
        if not data.get('name'):
            return api_error('Название услуги обязательно', status=400)
        if not data.get('duration'):
            return api_error('Длительность обязательна', status=400)
        if not data.get('price'):
            return api_error('Цена обязательна', status=400)
        
        # Проверка категории
        category_id = data.get('category_id')
        category = None
        if category_id:
            try:
                category = ServiceCategory.objects.get(id=category_id, master=request.user.master)
            except ServiceCategory.DoesNotExist:
                return api_error('Категория не найдена', status=404)
        
        # Обновляем услугу
        service.category = category
        service.name = data.get('name')
        service.description = data.get('description', '')
        service.duration = data.get('duration')
        service.price = data.get('price')
        service.is_active = data.get('is_active', True)
        service.save()
        
        return api_success({'message': 'Услуга обновлена'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при обновлении услуги', status=500)


@login_required
@require_http_methods(["POST"])
def api_delete_service(request, service_id):
    """Удаляет услугу мастера."""
    try:
        service = Service.objects.get(id=service_id, master=request.user.master)
        service.delete()
        return api_success({'message': 'Услуга удалена'})
    except Service.DoesNotExist:
        return api_error('Услуга не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении услуги', status=500)


@login_required
def get_categories(request):
    """Возвращает категории и услуги мастера для страницы /services/."""
    master = request.user.master
    categories = ServiceCategory.objects.filter(master=master, is_active=True)
    
    # Получаем услуги без категории
    uncategorized = Service.objects.filter(master=master, category__isnull=True, is_active=True)
    
    data = []
    for cat in categories:
        services = Service.objects.filter(master=master, category=cat, is_active=True)
        data.append({
            'id': cat.id,
            'name': cat.name,
            'order': cat.order,
            'services': [{
                'id': s.id,
                'name': s.name,
                'description': s.description,
                'duration': s.duration,
                'price': float(s.price)
            } for s in services]
        })
    
    return JsonResponse({
        'categories': data,
        'uncategorized': [{
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'duration': s.duration,
            'price': float(s.price)
        } for s in uncategorized]
    })


# ============================================================
# API ДЛЯ КАТЕГОРИЙ
# ============================================================

@login_required
@require_http_methods(["POST"])
def api_add_category(request):
    """Создаёт новую категорию услуг."""
    try:
        master = request.user.master
        data = json.loads(request.body)
        
        if not data.get('name'):
            return api_error('Название категории обязательно', status=400)
        
        category = ServiceCategory.objects.create(
            master=master,
            name=data.get('name'),
            order=data.get('order', 0)
        )
        
        return api_success({'id': category.id})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при создании категории', status=500)


@login_required
@require_http_methods(["POST"])
def api_edit_category(request, category_id):
    """Редактирует существующую категорию услуг."""
    try:
        try:
            category = ServiceCategory.objects.get(id=category_id, master=request.user.master)
        except ServiceCategory.DoesNotExist:
            return api_error('Категория не найдена', status=404)
        
        data = json.loads(request.body)
        
        if not data.get('name'):
            return api_error('Название категории обязательно', status=400)
        
        category.name = data.get('name')
        category.order = data.get('order', 0)
        category.save()
        
        return api_success({'message': 'Категория обновлена'})
        
    except json.JSONDecodeError:
        return api_error('Неверный формат данных', status=400)
    except Exception as e:
        return api_error('Ошибка при обновлении категории', status=500)


@login_required
@require_http_methods(["POST"])
def api_delete_category(request, category_id):
    """Удаляет категорию услуг (услуги перемещаются в «Без категории»)."""
    try:
        category = ServiceCategory.objects.get(id=category_id, master=request.user.master)
        Service.objects.filter(category=category).update(category=None)
        category.delete()
        return api_success({'message': 'Категория удалена'})
    except ServiceCategory.DoesNotExist:
        return api_error('Категория не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка при удалении категории', status=500)


@login_required
def api_get_service(request, service_id):
    """Возвращает данные одной услуги (для формы редактирования)."""
    try:
        service = Service.objects.get(id=service_id, master=request.user.master)
        return api_success({
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'duration': service.duration,
            'price': float(service.price),
            'is_active': service.is_active,
            'category_id': service.category_id
        })
    except Service.DoesNotExist:
        return api_error('Услуга не найдена', status=404)
    except Exception as e:
        return api_error('Ошибка при загрузке услуги', status=500)


# ============================================================
# ПУБЛИЧНЫЕ КАТЕГОРИИ (для страницы мастера)
# ============================================================

def get_master_categories(request, identifier):
    """Возвращает категории и услуги мастера для публичной страницы."""
    try:
        master = get_master_by_identifier(identifier)
    except Http404:
        return JsonResponse({'error': 'Мастер не найден'}, status=404)
    
    categories = ServiceCategory.objects.filter(master=master, is_active=True)
    uncategorized = Service.objects.filter(master=master, category__isnull=True, is_active=True)
    
    data = []
    for cat in categories:
        services = Service.objects.filter(master=master, category=cat, is_active=True)
        data.append({
            'id': cat.id,
            'name': cat.name,
            'order': cat.order,
            'services': [{
                'id': s.id,
                'name': s.name,
                'description': s.description,
                'duration': s.duration,
                'price': float(s.price),
                'category_name': cat.name,
            } for s in services]
        })
    
    return JsonResponse({
        'categories': data,
        'uncategorized': [{
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'duration': s.duration,
            'price': float(s.price),
            'category_name': None,
        } for s in uncategorized]
    })