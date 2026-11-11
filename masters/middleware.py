class NoCacheHTMLMiddleware:
    """
    Запрещает браузеру кешировать HTML-ответы.
    
    Нужно, чтобы window.location.reload() всегда отдавал свежий HTML
    (а не из кеша). Особенно важно для страниц, которые рендерят
    data-атрибуты для React (data-master-mode и т.п.).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response.get('Content-Type', '').startswith('text/html'):
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response