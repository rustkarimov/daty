"""
Главные страницы: home (промо) и service worker.
"""
import os
from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings


def home(request):
    """Главная промо-страница сайта."""
    return render(request, 'masters/public/index.html')


def service_worker(request):
    """Отдаёт service-worker.js из корня сайта с правильными заголовками."""
    sw_path = os.path.join(settings.BASE_DIR, 'static', 'service-worker.js')
    if not os.path.exists(sw_path):
        return HttpResponse('// SW not found', content_type='application/javascript', status=404)
    
    with open(sw_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    response = HttpResponse(content, content_type='application/javascript')
    response['Service-Worker-Allowed'] = '/'
    response['Cache-Control'] = 'no-cache'
    return response