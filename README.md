# ДАТЫ

Сервис для самозанятых мастеров: запись клиентов, расписание, статистика.

## Что умеет

- Умное расписание — настройка рабочих дней, перерывов, выходных
- Услуги с категориями — гибкое управление прайсом
- Запись клиентов — личная страница мастера с онлайн-записью
- Статистика — визиты клиентов, лояльность, чёрный список
- Шифрование телефонов — данные клиентов защищены (Fernet)
- Чат поддержки — прямая связь с администрацией
- PWA — работает как мобильное приложение (в разработке)
- Два режима: home (дома) и away (выезд)

## Стек

- Backend: Django 4.2, Python 3.11
- Frontend: Django Templates + React (Vite), Bootstrap 5
- БД: SQLite (dev) / PostgreSQL (prod)
- Шифрование: Fernet (cryptography)
- SMS: SMS.ru
- Push: pywebpush (VAPID)

## Установка (локально)

### Требования

- Python 3.11+
- pip
- Node.js 18+
- Git

### Шаги

1. Клонировать репозиторий:

git clone <url-репозитория>
cd mymaster
text


2. Создать виртуальное окружение:

python -m venv venv
text


3. Активировать:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

4. Установить зависимости:

pip install -r requirements.txt
text


5. Создать `.env`:

copy .env.example .env # Windows
cp .env.example .env # Linux/Mac
text


6. Отредактировать `.env` — вставить свои значения.

7. Применить миграции:

python manage.py migrate
text


8. Создать суперпользователя:

python manage.py createsuperuser
text


9. Собрать фронтенд:

cd frontend
npm install
npm run build
cd ..
text


10. Запустить сервер:

python manage.py runserver
text


### Запуск тестов

python manage.py test
text


19 тестов покрывают:
- Создание записи (10 тестов)
- Регистрация мастера (3 теста)
- Отмена записи (3 теста)
- Расчёт слотов (3 теста)

## Структура проекта

mymaster/
├── mymaster/ # Настройки Django
│ ├── settings.py
│ ├── urls.py
│ └── ...
├── masters/ # Основное приложение
│ ├── models.py # Модели: Master, Service, Booking, ...
│ ├── views/ # Views (разбиты по модулям)
│ │ ├── dashboard.py
│ │ ├── bookings.py
│ │ ├── public.py
│ │ ├── schedule.py
│ │ ├── services.py
│ │ ├── profile.py
│ │ ├── auth.py
│ │ ├── client_api.py
│ │ ├── clients.py
│ │ ├── notifications.py
│ │ ├── support.py
│ │ └── ...
│ ├── utils/ # Утилиты
│ │ ├── schedule_utils.py # Расчёт слотов
│ │ ├── sms_utils.py # Отправка SMS
│ │ ├── call_utils.py # Звонки (SMS.ru)
│ │ ├── master_utils.py # Поиск мастера
│ │ ├── push_utils.py # Push-уведомления
│ │ └── response_utils.py # API-ответы
│ ├── templates/ # HTML-шаблоны
│ │ ├── masters/ # Шаблоны кабинета
│ │ └── admin/ # Кастомная админка
│ ├── tests/ # Тесты
│ └── ...
├── frontend/ # React-приложение (Vite)
│ ├── src/
│ │ ├── components/
│ │ │ ├── Dashboard/
│ │ │ ├── Services/
│ │ │ ├── Schedule/
│ │ │ ├── Clients/
│ │ │ ├── Profile/
│ │ │ ├── Public/
│ │ │ └── modals/
│ │ ├── api/
│ │ ├── hooks/
│ │ ├── utils/
│ │ └── entries/
│ ├── package.json
│ └── vite.config.js
├── static/ # Статика
│ ├── css/
│ ├── js/
│ └── images/
├── media/ # Загруженные файлы (аватары)
├── requirements.txt # Зависимости
├── .env.example # Шаблон окружения
├── .gitignore
└── manage.py
text


## Основные API endpoints

### Публичные (для клиентов)

- `GET /api/master/<slug>/categories/` — услуги мастера
- `GET /api/<slug>/dates/?total_duration=60` — доступные даты
- `GET /api/<slug>/slots/?total_duration=60&date=2026-10-01` — доступные слоты
- `POST /api/<slug>/book/` — создать запись (одна услуга)
- `POST /api/<slug>/book-multiple/` — создать запись (несколько услуг)

### Приватные (для мастера, требуется авторизация)

- `GET /api/bookings/` — список записей (пагинация)
- `POST /api/booking/<id>/delete/` — удалить запись
- `POST /api/booking/<id>/confirm/` — подтвердить запись
- `POST /api/booking/<id>/unconfirm/` — снять подтверждение
- `GET /api/clients-statistics/` — статистика клиентов
- `POST /api/services/add/` — добавить услугу
- `GET /api/schedule/calendar/` — расписание для календаря
- `GET /api/day-status/?date=2026-10-01` — статус дня
- `POST /api/away-travel/update/` — время на дорогу (away)

### Аутентификация

- `POST /api/mobile/login/` — вход
- `POST /api/mobile/register/` — регистрация
- `POST /api/mobile/verify/` — подтверждение кода

### Push-уведомления

- `GET /api/push/vapid-key/` — публичный VAPID-ключ
- `POST /api/push/subscribe/` — подписка
- `POST /api/push/unsubscribe/` — отписка
- `POST /api/push/check/` — проверка подписки

## Режимы работы

### Home (дома)

- `Schedule`, `ExtraWorkingDay`, `DayOff` — расписание, доп. дни, выходные.
- `Break`, `ExtraWorkingDayBreak` — перерывы.
- Услуги — общие (не фильтруются по режиму).

### Away (выезд)

- `AwaySchedule`, `AwayExtraDay`, `AwayDayOff` — расписание, доп. дни, выходные.
- `AwayBreak`, `AwayExtraDayBreak` — перерывы.
- `Master.away_travel_time_before_default`, `Master.away_travel_time_after_default` — время на дорогу (default).
- `Master.arrival_window_minutes` — интервал приезда (0–120).
- `Booking.travel_time_before`, `Booking.travel_time_after`, `Booking.duration_extra_minutes` — для конкретной записи.
- `Booking.service_mode = 'away'`, `Booking.status = 'pending'` (до подтверждения), `Booking.client_address` — адрес.

### Переключение

- `WorkModeToggle` в `DashboardPage` (перед `PushSettings`).
- `Master.work_mode` = `home` / `away`.
- При переключении — страницы (расписание, календарь, услуги) показывают данные соответствующего режима.

## Безопасность

- Шифрование телефонов — Fernet (AES-128)
- CSRF-защита — Django встроенная
- XSS-защита — экранирование в шаблонах и JS
- SQL-инъекции — Django ORM защищает
- Пароли — bcrypt (Django default)
- Rate limit — SMS, звонки (django.core.cache)

## Как внести вклад

1. Создайте ветку: `git checkout -b feature/название`
2. Внесите изменения
3. Запустите тесты: `python manage.py test`
4. Соберите фронт: `cd frontend && npm run build`
5. Если всё ок — коммит: `git commit -m "Описание"`
6. Push: `git push origin feature/название`
7. Создайте Pull Request