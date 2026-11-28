class NoCacheHTMLMiddleware:
    """
    Запрещает браузеру кешировать HTML-ответы ЛИЧНОГО КАБИНЕТА.
    Публичные страницы (блог, лендинг, страница мастера) кешируются нормально.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Если это HTML
        if response.get('Content-Type', '').startswith('text/html'):
            path = request.path
            
            # Список путей, которые НЕЛЬЗЯ кешировать (кабинет и админка)
            no_cache_prefixes = (
                '/dashboard/', '/services/', '/schedule/', 
                '/profile/', '/clients-statistics/', '/admin/'
            )
            
            if any(path.startswith(prefix) for prefix in no_cache_prefixes):
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
            else:
                # Для публичных страниц разрешаем кеш на 5 минут (300 секунд)
                response['Cache-Control'] = 'public, max-age=300'
                
        return response