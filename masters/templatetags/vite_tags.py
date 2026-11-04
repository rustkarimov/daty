import json
import os
from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.safestring import mark_safe

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
    """Возвращает все CSS-файлы из манифеста (для указанного entry и всех его imports)."""
    manifest = _get_manifest()
    
    css_files = set()

    def collect_css(key):
        if key in manifest:
            if 'css' in manifest[key]:
                css_files.update(manifest[key]['css'])
            if 'imports' in manifest[key]:
                for imp in manifest[key]['imports']:
                    collect_css(imp)

    collect_css(path)

    # Если ничего не нашли — просто вернем все CSS из манифеста (на всякий случай)
    if not css_files:
        for key, value in manifest.items():
            if 'css' in value:
                css_files.update(value['css'])

    if css_files:
        return mark_safe(' '.join(
            f'<link rel="stylesheet" href="{static(f"js/react/{f}")}">'
            for f in sorted(css_files)
        ))
    return ""