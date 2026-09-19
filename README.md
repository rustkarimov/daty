# ДАТЫ

Сервис для самозанятых мастеров: запись клиентов, расписание, статистика.

## Что умеет

- 📅 **Умное расписание** — настройка рабочих дней, перерывов, выходных
- ✂️ **Услуги с категориями** — гибкое управление прайсом
- 👥 **Запись клиентов** — личная страница мастера с онлайн-записью
- 📊 **Статистика** — визиты клиентов, лояльность, чёрный список
- 🔒 **Шифрование телефонов** — данные клиентов защищены (Fernet)
- 💬 **Чат поддержки** — прямая связь с администрацией
- 📱 **PWA** — работает как мобильное приложение *(в разработке)*

## Стек

- **Backend:** Django 4.2, Python 3.11
- **Frontend:** Django Templates + Vanilla JS, Bootstrap 5
- **БД:** SQLite (dev) / PostgreSQL (prod)
- **Шифрование:** Fernet (cryptography)
- **SMS:** SMS.ru

## Установка (локально)

### Требования
- Python 3.11+
- pip
- Git

### Шаги

```bash
# 1. Клонировать репозиторий
git clone <url-репозитория>
cd mymaster

# 2. Создать виртуальное окружение
python -m venv venv

# Активировать
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Установить зависимости
pip install -r requirements.txt

# 4. Создать .env
copy .env.example .env       # Windows
# или
cp .env.example .env         # Linux/Mac

# 5. Отредактировать .env — вставить свои значения

# 6. Применить миграции
python manage.py migrate

# 7. Создать суперпользователя (для админки)
python manage.py createsuperuser

# 8. Запустить сервер
python manage.py runserver


Запуск тестов
bash

python manage.py test

19 тестов покрывают:

    Создание записи (10 тестов)

    Регистрация мастера (3 теста)

    Отмена записи (3 теста)

    Расчёт слотов (3 теста)

Структура проекта

mymaster/
├── mymaster/              # Настройки Django
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── masters/               # Основное приложение
│   ├── models.py          # Модели: Master, Service, Booking, ...
│   ├── views.py           # Views: страницы + API
│   ├── forms.py           # Формы
│   ├── admin.py           # Админка
│   ├── signals.py         # Сигналы (создание профиля, уведомления)
│   ├── urls.py            # URL-ы
│   ├── utils/             # Утилиты
│   │   ├── schedule_utils.py    # Расчёт слотов
│   │   ├── sms_utils.py         # Отправка SMS
│   │   ├── call_utils.py        # Звонки (SMS.ru)
│   │   ├── master_utils.py      # Поиск мастера
│   │   └── response_utils.py    # API-ответы
│   ├── templates/         # HTML-шаблоны
│   │   ├── masters/       # Шаблоны кабинета
│   │   └── admin/         # Кастомная админка
│   ├── tests/             # Тесты
│   │   ├── factories.py
│   │   ├── test_booking.py
│   │   ├── test_registration.py
│   │   ├── test_cancellation.py
│   │   └── test_schedule.py
│   └── ...
├── static/                # Статика
│   ├── css/
│   ├── js/
│   └── images/
├── media/                 # Загруженные файлы (аватары)
├── requirements.txt       # Зависимости
├── .env.example           # Шаблон окружения
├── .gitignore
└── manage.py


Основные API endpoints
Публичные (для клиентов)

    GET /api/master/<slug>/categories/ — услуги мастера

    GET /api/<slug>/dates/?total_duration=60 — доступные даты

    GET /api/<slug>/slots/?total_duration=60&date=2026-10-01 — доступные слоты

    POST /api/<slug>/book/ — создать запись (одна услуга)

    POST /api/<slug>/book-multiple/ — создать запись (несколько услуг)

Приватные (для мастера, требуется авторизация)

    GET /api/bookings/ — список записей (пагинация)

    POST /api/booking/<id>/delete/ — удалить запись

    POST /api/booking/<id>/confirm/ — подтвердить запись

    GET /api/clients-statistics/ — статистика клиентов

    POST /api/services/add/ — добавить услугу

Аутентификация

    POST /api/mobile/login/ — вход

    POST /api/mobile/register/ — регистрация

    POST /api/mobile/verify/ — подтверждение кода

Безопасность

    ✅ Шифрование телефонов — Fernet (AES-128)

    ✅ CSRF-защита — Django встроенная

    ✅ XSS-защита — экранирование в шаблонах и JS

    ✅ SQL-инъекции — Django ORM защищает

    ✅ Пароли — bcrypt (Django default)

Как внести вклад

    Создайте ветку: git checkout -b feature/название

    Внесите изменения

    Запустите тесты: python manage.py test

    Если всё ок — коммит: git commit -m "Описание"

    Push: git push origin feature/название

    Создайте Pull Request