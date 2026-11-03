import json
import os
from django import template
from django.conf import settings
from django.templatetags.static import static

register = template.Library()

def _get_manifest():
    manifest_path = os.path.join(settings.BASE_DIR, 'masters', 'static', 'js', 'react', '.vite', 'manifest.json')
    if not os.path.exists(manifest_path):
        return {}
    with open(manifest_path, 'r') as f:
        return json.load(f)

@register.simple_tag
def vite_asset(path):
    """Возвращает путь к JS-файлу (с хэшем)."""
    manifest = _get_manifest()
    if path in manifest:
        file_hash = manifest[path]['file']
        return static(f"js/react/{file_hash}")
    return static('js/react/app.js') # Fallback

@register.simple_tag
def vite_css(path):
    """Возвращает путь к CSS-файлу (с хэшем), если он есть в манифесте."""
    manifest = _get_manifest()
    if path in manifest and 'css' in manifest[path]:
        css_files = manifest[path]['css']
        if css_files:
            # Берем первый CSS-файл из списка
            return static(f"js/react/{css_files[0]}")
    return ""