from django.db import migrations
from datetime import timedelta

# Все DateTimeField в приложении masters.
# Формат: (app_label, model_name, field_name)
FIELDS = [
    ('masters', 'Master', 'created_at'),
    ('masters', 'Master', 'updated_at'),
    ('masters', 'PhoneVerification', 'created_at'),
    ('masters', 'Booking', 'created_at'),
    ('masters', 'Booking', 'updated_at'),
    ('masters', 'CancelledBooking', 'cancelled_at'),
    ('masters', 'BlacklistedClient', 'created_at'),
    ('masters', 'Notification', 'created_at'),
    ('masters', 'SupportMessage', 'created_at'),
    ('masters', 'PushSubscription', 'created_at'),
    ('masters', 'ClientSession', 'created_at'),
    ('masters', 'ClientSession', 'last_activity'),
]

MSK_OFFSET = timedelta(hours=3)  # Europe/Moscow = UTC+3 (без DST с 2014)


def forwards(apps, schema_editor):
    """Naive (было в МСК) → aware UTC. Вычитаем 3 часа."""
    for app_label, model_name, field_name in FIELDS:
        Model = apps.get_model(app_label, model_name)
        # values_list('pk', field_name) — быстрее, чем грузить целиком
        for pk, value in Model.objects.values_list('pk', field_name).iterator():
            if value is None:
                continue
            # value сейчас naive и означает МСК.
            new_value = value - MSK_OFFSET
            Model.objects.filter(pk=pk).update(**{field_name: new_value})


def backwards(apps, schema_editor):
    """Откат: UTC → naive МСК. Прибавляем 3 часа."""
    for app_label, model_name, field_name in FIELDS:
        Model = apps.get_model(app_label, model_name)
        for pk, value in Model.objects.values_list('pk', field_name).iterator():
            if value is None:
                continue
            new_value = value + MSK_OFFSET
            Model.objects.filter(pk=pk).update(**{field_name: new_value})


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0020_master_push_status'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]