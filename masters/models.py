"""
Модели приложения masters.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from cryptography.fernet import Fernet
import secrets


def generate_booking_token():
    """Генерирует уникальный токен для записи."""
    return secrets.token_urlsafe(16)  # 22 символа, URL-safe


# ============================================================
# ПОЛЬЗОВАТЕЛИ
# ============================================================

class CustomUserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('Телефон обязателен')
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None
    phone = models.CharField(max_length=20, unique=True, verbose_name="Телефон")

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.phone


# ============================================================
# МАСТЕРА
# ============================================================

class Master(models.Model):
    WORK_MODE_CHOICES = [
        ('home', 'Дома'),
        ('away', 'Выезд'),
    ]

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, verbose_name="Пользователь"
    )
    phone = models.CharField(max_length=20, verbose_name="Телефон мастера")
    first_name = models.CharField(max_length=50, verbose_name="Имя", blank=True)
    last_name = models.CharField(max_length=50, verbose_name="Фамилия", blank=True)
    bio = models.TextField(verbose_name="О себе", blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Аватар")
    login = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        verbose_name="Логин (для ссылки)",
        help_text="Оставьте пустым, чтобы ссылка была с ID",
    )
    address = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Адрес мастера",
        help_text="Где вы принимаете клиентов",
    )

    # ---- Режим работы ----
    work_mode = models.CharField(
        max_length=10,
        choices=WORK_MODE_CHOICES,
        default='home',
        verbose_name="Режим работы",
    )

    min_booking_lead_time = models.IntegerField(
        default=0,
        verbose_name="Не принимать записи за (часов)",
    )
    home_buffer_between_bookings = models.IntegerField(
        default=0,
        verbose_name="Пауза между записями (мин)",
    )

    # ---- Выездной режим ----
    away_base_address = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Адрес, откуда выезжаю",
        help_text="Для расчёта времени на дорогу",
    )
    away_travel_time_before_default = models.IntegerField(
        default=0,
        verbose_name="Время на дорогу туда по умолчанию (мин)",
    )
    away_travel_time_after_default = models.IntegerField(
        default=0,
        verbose_name="Время на дорогу обратно по умолчанию (мин)",
    )
    arrival_window_minutes = models.IntegerField(
        default=30,
        verbose_name="Интервал прибытия (мин)",
        help_text="Ширина интервала, в который мастер может приехать (0–120)",
    )
    away_buffer_before = models.IntegerField(
        default=15,
        verbose_name="Буфер до выезда (мин)",
    )
    away_buffer_after = models.IntegerField(
        default=15,
        verbose_name="Буфер после выезда (мин)",
    )

    # ---- Шифрование ----
    encryption_key = models.BinaryField(
        verbose_name="Ключ шифрования", null=True, blank=True, editable=False
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ---- Мессенджеры ----
    telegram_username = models.CharField(max_length=100, blank=True, null=True, verbose_name="Telegram @username")
    max_link = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ссылка на профиль MAX")
    whatsapp_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Номер WhatsApp")

    class Meta:
        verbose_name = "Самозанятый мастер"
        verbose_name_plural = "Самозанятые мастера"

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or self.user.phone

    @property
    def public_slug(self):
        if self.login:
            return self.login
        return f"id{self.id}"

    @property
    def is_away(self):
        return self.work_mode == 'away'

    def save(self, *args, **kwargs):
        if not self.encryption_key:
            self.generate_encryption_key()
        super().save(*args, **kwargs)

    def generate_encryption_key(self):
        key = Fernet.generate_key()
        self.encryption_key = key
        return key

    def get_encryption_key(self):
        return self.encryption_key


# ============================================================
# КОДЫ ПОДТВЕРЖДЕНИЯ
# ============================================================

class PhoneVerification(models.Model):
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    code = models.CharField(max_length=6, verbose_name="Код подтверждения")
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Код подтверждения"
        verbose_name_plural = "Коды подтверждения"

    def __str__(self):
        return f"{self.phone} - {self.code}"


# ============================================================
# УСЛУГИ
# ============================================================

class ServiceCategory(models.Model):
    """Категория услуг (группа)."""
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='service_categories')
    name = models.CharField(max_length=100, verbose_name="Название категории")
    order = models.IntegerField(default=0, verbose_name="Порядок сортировки")
    is_active = models.BooleanField(default=True, verbose_name="Активна")
    mode = models.CharField(
        max_length=10,
        choices=[('home', 'Дома'), ('away', 'Выезд')],
        default='home',
        verbose_name="Режим",
    )

    class Meta:
        verbose_name = "Категория услуг"
        verbose_name_plural = "Категории услуг"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Service(models.Model):
    """Услуги мастера."""
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='services',
        verbose_name="Категория",
    )
    name = models.CharField(max_length=100, verbose_name="Название услуги")
    description = models.TextField(verbose_name="Описание", blank=True)
    duration = models.IntegerField(verbose_name="Длительность (минут)")
    price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Цена")
    is_active = models.BooleanField(default=True, verbose_name="Активна")
    mode = models.CharField(
        max_length=10,
        choices=[('home', 'Дома'), ('away', 'Выезд')],
        default='home',
        verbose_name="Режим",
    )

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"

    def __str__(self):
        return self.name


# ============================================================
# РАСПИСАНИЕ (ДОМА)
# ============================================================

class Schedule(models.Model):
    """Регулярное расписание (на неделю)."""
    DAYS_OF_WEEK = [
        (0, 'Понедельник'),
        (1, 'Вторник'),
        (2, 'Среда'),
        (3, 'Четверг'),
        (4, 'Пятница'),
        (5, 'Суббота'),
        (6, 'Воскресенье'),
    ]

    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK, verbose_name="День недели")
    start_time = models.TimeField(verbose_name="Начало работы")
    end_time = models.TimeField(verbose_name="Конец работы")
    is_working = models.BooleanField(default=True, verbose_name="Рабочий день")

    class Meta:
        verbose_name = "Расписание"
        verbose_name_plural = "Расписание"
        unique_together = ['master', 'day_of_week']

    def __str__(self):
        return f"{self.get_day_of_week_display()}: {self.start_time} - {self.end_time}"


class Break(models.Model):
    """Перерыв в рабочем дне."""
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='breaks')
    start_time = models.TimeField(verbose_name="Начало перерыва")
    end_time = models.TimeField(verbose_name="Конец перерыва")

    class Meta:
        verbose_name = "Перерыв"
        verbose_name_plural = "Перерывы"

    def __str__(self):
        return f"{self.start_time} - {self.end_time}"


class DayOff(models.Model):
    """Выходные дни (общие для дома и выезда)."""
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='days_off')
    date = models.DateField(verbose_name="Дата")
    reason = models.CharField(max_length=200, verbose_name="Причина", blank=True)

    class Meta:
        verbose_name = "Выходной день"
        verbose_name_plural = "Выходные дни"
        unique_together = ['master', 'date']

    def __str__(self):
        return f"{self.date}: {self.reason or 'Выходной'}"


class ExtraWorkingDay(models.Model):
    """Дополнительный рабочий день (вне регулярного расписания)."""
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='extra_days')
    date = models.DateField(verbose_name="Дата")
    start_time = models.TimeField(verbose_name="Начало работы")
    end_time = models.TimeField(verbose_name="Конец работы")

    class Meta:
        verbose_name = "Дополнительный рабочий день"
        verbose_name_plural = "Дополнительные рабочие дни"
        unique_together = ['master', 'date']

    def __str__(self):
        return f"{self.date}: {self.start_time} - {self.end_time}"


class ExtraWorkingDayBreak(models.Model):
    """Перерыв в дополнительном рабочем дне."""
    extra_day = models.ForeignKey(ExtraWorkingDay, on_delete=models.CASCADE, related_name='breaks')
    start_time = models.TimeField(verbose_name="Начало перерыва")
    end_time = models.TimeField(verbose_name="Конец перерыва")

    class Meta:
        verbose_name = "Перерыв (доп. день)"
        verbose_name_plural = "Перерывы (доп. дни)"

    def __str__(self):
        return f"{self.start_time} - {self.end_time}"


# ============================================================
# РАСПИСАНИЕ (ВЫЕЗД)
# ============================================================

class AwaySchedule(models.Model):
    """
    Регулярное расписание выездного мастера.
    По дням недели: в какие часы мастер выезжает.
    """
    DAYS_OF_WEEK = [
        (0, 'Понедельник'),
        (1, 'Вторник'),
        (2, 'Среда'),
        (3, 'Четверг'),
        (4, 'Пятница'),
        (5, 'Суббота'),
        (6, 'Воскресенье'),
    ]

    master = models.ForeignKey(
        Master, on_delete=models.CASCADE, related_name='away_schedules'
    )
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK, verbose_name="День недели")
    start_time = models.TimeField(verbose_name="Начало работы")
    end_time = models.TimeField(verbose_name="Конец работы")
    is_working = models.BooleanField(default=True, verbose_name="Рабочий день")

    class Meta:
        verbose_name = "Расписание выездов"
        verbose_name_plural = "Расписание выездов"
        unique_together = ['master', 'day_of_week']

    def __str__(self):
        return f"{self.get_day_of_week_display()}: {self.start_time} - {self.end_time}"


class AwayExtraDay(models.Model):
    """Дополнительный выездной день (вне регулярного расписания)."""
    master = models.ForeignKey(
        Master, on_delete=models.CASCADE, related_name='away_extra_days'
    )
    date = models.DateField(verbose_name="Дата")
    start_time = models.TimeField(verbose_name="Начало работы")
    end_time = models.TimeField(verbose_name="Конец работы")

    class Meta:
        verbose_name = "Доп. выездной день"
        verbose_name_plural = "Доп. выездные дни"
        unique_together = ['master', 'date']

    def __str__(self):
        return f"{self.date}: {self.start_time} - {self.end_time}"


class AwayDayOff(models.Model):
    """Выходной день для выездного режима."""
    master = models.ForeignKey(
        Master, on_delete=models.CASCADE, related_name='away_days_off'
    )
    date = models.DateField(verbose_name="Дата")
    reason = models.CharField(max_length=200, verbose_name="Причина", blank=True)

    class Meta:
        verbose_name = "Выходной день (выезд)"
        verbose_name_plural = "Выходные дни (выезд)"
        unique_together = ['master', 'date']

    def __str__(self):
        return f"{self.date}: {self.reason or 'Выходной'}"

class AwayBreak(models.Model):
    """Перерыв в регулярном выездном расписании."""
    schedule = models.ForeignKey(
        AwaySchedule, on_delete=models.CASCADE, related_name='breaks'
    )
    start_time = models.TimeField(verbose_name="Начало перерыва")
    end_time = models.TimeField(verbose_name="Конец перерыва")

    class Meta:
        verbose_name = "Перерыв (выезд)"
        verbose_name_plural = "Перерывы (выезд)"

    def __str__(self):
        return f"{self.start_time} - {self.end_time}"


class AwayExtraDayBreak(models.Model):
    """Перерыв в дополнительном выездном дне."""
    extra_day = models.ForeignKey(
        AwayExtraDay, on_delete=models.CASCADE, related_name='breaks'
    )
    start_time = models.TimeField(verbose_name="Начало перерыва")
    end_time = models.TimeField(verbose_name="Конец перерыва")

    class Meta:
        verbose_name = "Перерыв (доп. выездной день)"
        verbose_name_plural = "Перерывы (доп. выездные дни)"

    def __str__(self):
        return f"{self.start_time} - {self.end_time}"

# ============================================================
# ЗАПИСИ
# ============================================================

class Booking(models.Model):
    """
    Запись клиента.

    Единая модель для дома и выезда.
    Для выездных записей:
      - service_mode = 'away'
      - status = 'pending' (до подтверждения мастером)
      - client_address заполнен
      - travel_time_minutes, buffer_before_minutes, buffer_after_minutes
    """
    STATUS_CHOICES = [
        ('pending', 'Ожидает подтверждения'),
        ('confirmed', 'Подтверждена'),
        ('cancelled', 'Отменена'),
        ('completed', 'Выполнена'),
    ]

    CREATED_BY_CHOICES = [
        ('client', 'Клиент'),
        ('master', 'Мастер'),
    ]

    SERVICE_MODE_CHOICES = [
        ('home', 'Дома'),
        ('away', 'Выезд'),
    ]

    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')

    # Данные клиента
    client_name = models.CharField(max_length=100, verbose_name="Имя клиента")
    encrypted_phone = models.BinaryField(verbose_name="Телефон (зашифрованный)")
    client_comment = models.TextField(verbose_name="Комментарий", blank=True)

    # Дата и время записи
    date = models.DateField(verbose_name="Дата записи")
    time = models.TimeField(verbose_name="Время записи")

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='confirmed', verbose_name="Статус"
    )

    created_by = models.CharField(
        max_length=10, choices=CREATED_BY_CHOICES, default='client', verbose_name="Кто создал"
    )

    confirmed_by_master = models.BooleanField(default=False, verbose_name="Подтверждено мастером")

    token = models.CharField(
        max_length=32,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Токен для клиента",
        help_text="Уникальный токен для управления записью клиентом",
    )

    # ---- Выездной режим ----
    service_mode = models.CharField(
        max_length=10,
        choices=SERVICE_MODE_CHOICES,
        default='home',
        verbose_name="Режим услуги",
    )
    client_address = models.CharField(
        max_length=255, blank=True, verbose_name="Адрес клиента"
    )
    travel_time_before = models.IntegerField(
        default=0, verbose_name="Время на дорогу до клиента (мин)"
    )
    travel_time_after = models.IntegerField(
        default=0, verbose_name="Время на дорогу после клиента (мин)"
    )
    duration_extra_minutes = models.IntegerField(
        default=0, verbose_name="Дополнительные минуты к услуге"
    )
    # Буферы не используем в расчётах, оставляем на будущее
    buffer_before_minutes = models.IntegerField(
        default=0, verbose_name="Буфер до (мин)"
    )
    buffer_after_minutes = models.IntegerField(
        default=0, verbose_name="Буфер после (мин)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Запись"
        verbose_name_plural = "Записи"
        ordering = ['date', 'time']
        unique_together = ['master', 'date', 'time']

    def __str__(self):
        return f"{self.client_name} - {self.date} {self.time}"

    def get_decrypted_phone(self, key):
        f = Fernet(key)
        return f.decrypt(bytes(self.encrypted_phone)).decode()

    @property
    def total_duration_minutes(self):
        base = self.service.duration if self.service else 0
        extra = self.duration_extra_minutes or 0
        if self.service_mode == 'away':
            return base + extra + (self.travel_time_before or 0) + (self.travel_time_after or 0)
        return base + extra

    def save(self, *args, **kwargs):
        if not self.token:
            while True:
                token = generate_booking_token()
                if not Booking.objects.filter(token=token).exists():
                    self.token = token
                    break
        super().save(*args, **kwargs)


class CancelledBooking(models.Model):
    """
    Отменённая запись. Хранится для истории/статистики.
    Создаётся при отмене записи клиентом или при добавлении клиента в ЧС.
    Оригинальная запись Booking удаляется, чтобы освободить слот.
    """
    CANCELLED_BY_CHOICES = [
        ('client', 'Клиент'),
        ('master', 'Мастер'),
        ('admin', 'Админ'),
        ('blacklist', 'Чёрный список'),
    ]

    master = models.ForeignKey(
        Master, on_delete=models.CASCADE, related_name='cancelled_bookings', verbose_name="Мастер"
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_bookings',
        verbose_name="Услуга",
    )

    client_name = models.CharField(max_length=100, verbose_name="Имя клиента")
    encrypted_phone = models.BinaryField(verbose_name="Телефон (зашифрованный)")
    client_comment = models.TextField(verbose_name="Комментарий", blank=True)

    date = models.DateField(verbose_name="Дата записи")
    time = models.TimeField(verbose_name="Время записи")

    cancelled_by = models.CharField(
        max_length=10,
        choices=CANCELLED_BY_CHOICES,
        default='client',
        verbose_name="Кто отменил",
    )
    reason = models.TextField(blank=True, verbose_name="Причина отмены")
    cancelled_at = models.DateTimeField(auto_now_add=True, verbose_name="Когда отменено")

    original_booking_id = models.IntegerField(
        null=True, blank=True, verbose_name="ID оригинальной записи"
    )

    class Meta:
        verbose_name = "Отменённая запись"
        verbose_name_plural = "Отменённые записи"
        ordering = ['-cancelled_at']
        indexes = [
            models.Index(fields=['master', 'date']),
            models.Index(fields=['-cancelled_at']),
        ]

    def __str__(self):
        return f"{self.client_name} - {self.date} {self.time} (отменена)"

    def get_decrypted_phone(self, key):
        f = Fernet(key)
        return f.decrypt(bytes(self.encrypted_phone)).decode()


# ============================================================
# ЧЁРНЫЙ СПИСОК
# ============================================================

class BlacklistedClient(models.Model):
    """Чёрный список клиентов."""
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='blacklisted_clients')
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    name = models.CharField(max_length=100, verbose_name="Имя", blank=True)
    reason = models.TextField(verbose_name="Причина блокировки", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Клиент в чёрном списке"
        verbose_name_plural = "Чёрный список клиентов"
        unique_together = ['master', 'phone']

    def __str__(self):
        return f"{self.phone} - {self.reason[:50]}"


# ============================================================
# УВЕДОМЛЕНИЯ
# ============================================================

class Notification(models.Model):
    TYPES = [
        ('new_booking', 'Новая запись'),
        ('cancelled_booking', 'Отмена записи'),
        ('changed_booking', 'Изменение записи'),
        ('pending_booking', 'Заявка'),
        ('system', 'Системное'),
        ('promo', 'Реклама/Акция'),
        ('warning', 'Предупреждение'),
    ]

    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()}: {self.title[:50]}"


# ============================================================
# ПОДДЕРЖКА
# ============================================================

class SupportMessage(models.Model):
    """Сообщение в чате поддержки."""
    DIRECTION_CHOICES = [
        ('user', 'Пользователь → Админ'),
        ('admin', 'Админ → Пользователь'),
    ]

    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='support_messages')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    message = models.TextField(verbose_name="Сообщение")
    is_read = models.BooleanField(default=False, verbose_name="Прочитано мастером")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = "Сообщение поддержки"
        verbose_name_plural = "Сообщения поддержки"

    def save(self, *args, **kwargs):
        self.message = self.message.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_direction_display()}: {self.message[:50]}"


# ============================================================
# PUSH-ПОДПИСКИ
# ============================================================

class PushSubscription(models.Model):
    """Подписка на push-уведомления."""
    master = models.ForeignKey(
        Master, on_delete=models.CASCADE, related_name='push_subscriptions', verbose_name="Мастер"
    )
    endpoint = models.TextField(verbose_name="Endpoint (URL push-сервиса)")
    p256dh = models.TextField(verbose_name="Публичный ключ клиента (p256dh)")
    auth = models.TextField(verbose_name="Auth-секрет клиента")
    user_agent = models.CharField(max_length=255, blank=True, verbose_name="User Agent")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Push-подписка"
        verbose_name_plural = "Push-подписки"
        unique_together = ['master', 'endpoint']

    def __str__(self):
        return f"{self.master} — {self.endpoint[:50]}..."


# ============================================================
# СЕССИИ КЛИЕНТОВ
# ============================================================

class ClientSession(models.Model):
    """
    Сессия клиента для доступа к своим записям.

    Жизненный цикл:
    1. Создаётся при запросе звонка (is_confirmed=False)
    2. После подтверждения — is_confirmed=True, session_key генерируется
    """
    master = models.ForeignKey(
        Master, on_delete=models.CASCADE, related_name='client_sessions', verbose_name="Мастер"
    )
    phone = models.CharField(max_length=20, verbose_name="Телефон клиента")

    check_id = models.CharField(max_length=100, blank=True, verbose_name="ID проверки звонка")
    call_phone = models.CharField(max_length=20, blank=True, verbose_name="Номер для звонка")

    is_confirmed = models.BooleanField(default=False, verbose_name="Подтверждён")

    session_key = models.CharField(
        max_length=100, unique=True, null=True, blank=True, verbose_name="Ключ сессии"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Сессия клиента"
        verbose_name_plural = "Сессии клиентов"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.phone} — {self.master} — {'✅' if self.is_confirmed else '⏳'}"