"""
Главные страницы: home (промо) и service worker.
"""
import os
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.conf import settings

from django.shortcuts import render, get_object_or_404
from ..models import Article, ArticleCategory



def home(request):
    """Главная промо-страница сайта. Залогиненных мастеров редиректим в кабинет."""
    if request.user.is_authenticated:
        return redirect('dashboard')

    latest_articles = Article.objects.filter(is_published=True).order_by('-published_at')[:3]
    return render(request, 'masters/public/index.html',{
        'latest_articles': latest_articles,})


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

def blog_list(request):
    articles = Article.objects.filter(is_published=True).order_by('-published_at')
    categories = ArticleCategory.objects.all()
    return render(request, 'masters/public/blog_list.html', {
        'articles': articles,
        'categories': categories,
        'category': None,
    })

def blog_category(request, slug):
    category = get_object_or_404(ArticleCategory, slug=slug)
    articles = Article.objects.filter(is_published=True, category=category).order_by('-published_at')
    categories = ArticleCategory.objects.all()
    return render(request, 'masters/public/blog_list.html', {
        'articles': articles,
        'categories': categories,
        'category': category,
    })

def blog_detail(request, slug):
    article = get_object_or_404(Article, slug=slug, is_published=True)
    return render(request, 'masters/public/blog_detail.html', {'article': article})
