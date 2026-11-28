from django.apps import AppConfig
from django.contrib.admin.apps import AdminConfig

class MastersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'masters'
    
    def ready(self):
        import masters.signals

class CustomAdminConfig(AdminConfig):
    default_site = 'masters.admin_support.CustomAdminSite'
    # Явно указываем, что это то же самое приложение 'admin'
    name = 'django.contrib.admin' 
    label = 'admin' 
