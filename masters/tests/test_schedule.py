from django.test import TestCase
from datetime import date, time, timedelta
from django.utils import timezone

from ..models import Booking, Service, Schedule, DayOff
from ..utils.schedule_utils import ScheduleCalculator
from .factories import (
    create_master,
    create_service,
    create_schedule,
    get_next_monday,
)


class HomeScheduleCalculatorTest(TestCase):
    """Тесты расчёта слотов для домашнего режима"""

    def setUp(self):
        self.master = create_master()
        self.master.work_mode = 'home'
        self.master.home_buffer_between_bookings = 15 # Буфер 15 мин
        self.master.save()
        
        self.service = create_service(self.master, duration=60)
        create_schedule(self.master, days=range(7), start=time(9,0), end=time(18,0))
        self.test_date = get_next_monday()
        self.calc = ScheduleCalculator(self.master)

    def test_empty_day_slots(self):
        """Пустой день: слоты идут с шагом 15"""
        slots = self.calc.generate_time_slots(self.test_date, 60)
        self.assertTrue(len(slots) > 0)
        self.assertEqual(slots[0]['start'], '09:00')
        self.assertEqual(slots[0]['end'], '') # Для дома end = пустая строка
        self.assertEqual(slots[1]['start'], '09:15')

    def test_home_buffer_between_bookings(self):
        """Буфер в домашнем режиме: между записями 15 минут"""
        # Создаём запись на 09:00-10:00
        Booking.objects.create(
            master=self.master, service=self.service,
            client_name='Клиент 1', encrypted_phone=b'fake',
            date=self.test_date, time=time(9, 0),
            status='confirmed'
        )
        slots = self.calc.generate_time_slots(self.test_date, 60)
        
        # Из-за буфера 15 минут, следующий слот не может быть раньше 10:15
        # Первый слот после занятости
        next_slots = [s for s in slots if s['start'] >= '10:00']
        self.assertTrue(len(next_slots) > 0)
        self.assertEqual(next_slots[0]['start'], '10:15')

    def test_booking_on_weekend(self):
        """Выходной день: слотов нет"""
        DayOff.objects.create(master=self.master, date=self.test_date)
        slots = self.calc.generate_time_slots(self.test_date, 60)
        self.assertEqual(len(slots), 0)


class AwayScheduleCalculatorTest(TestCase):
    """Тесты расчёта слотов для выездного режима"""

    def setUp(self):
        self.master = create_master()
        self.master.work_mode = 'away'
        self.master.away_travel_time_before_default = 30
        self.master.away_travel_time_after_default = 30
        self.master.arrival_window_minutes = 30
        self.master.save()
        
        self.service = create_service(self.master, duration=60)
        # Для away нужны AwaySchedule
        from ..models import AwaySchedule
        for day in range(7):
            AwaySchedule.objects.create(
                master=self.master, day_of_week=day,
                start_time=time(9,0), end_time=time(18,0), is_working=True
            )
            
        self.test_date = get_next_monday()
        self.calc = ScheduleCalculator(self.master)

    def test_away_empty_day(self):
        """Выездной режим: слот = [A, A+W]"""
        slots = self.calc.generate_time_slots(self.test_date, 60)
        self.assertTrue(len(slots) > 0)
        self.assertEqual(slots[0]['start'], '09:00')
        self.assertEqual(slots[0]['end'], '09:30') # Интервал приезда

    def test_away_absorption(self):
        """Выездной режим: поглощение дорог (мастер не может успеть на 11:30)"""
        # Запись на 09:00 (A=09:00, B=30, W=30, S=60, F=30)
        # Занятость: [08:30, 11:00]
        Booking.objects.create(
            master=self.master, service=self.service,
            client_name='Клиент 1', encrypted_phone=b'fake',
            date=self.test_date, time=time(9, 0),
            status='confirmed', service_mode='away',
            travel_time_before=30, travel_time_after=30
        )
        
        slots = self.calc.generate_time_slots(self.test_date, 60)
        
        # Следующий клиент (B=30) не может приехать раньше 11:00
        # Так как поглощение F_prev(30) и B_new(30) = max(30,30) = 30
        self.assertTrue(len(slots) > 0)
        self.assertEqual(slots[0]['start'], '11:00')

    def test_away_longer_drive(self):
        """Выездной режим: если B_new > F_prev, слот отодвигается"""
        # Запись на 09:00, дорога после = 30, дорога до = 30. Занятость [08:30, 11:00]
        Booking.objects.create(
            master=self.master, service=self.service,
            client_name='Клиент 1', encrypted_phone=b'fake',
            date=self.test_date, time=time(9, 0),
            status='confirmed', service_mode='away',
            travel_time_before=30, travel_time_after=30
        )
        
        # Новый клиент: дорога до 50 минут. 
        # min_a = service_end (10:00) + 50 = 10:50. Но занятость первого до 11:00.
        # Значит, первый слот будет 11:00.
        slots = self.calc.generate_time_slots(
            self.test_date, 60, travel_before_override=50
        )
        self.assertTrue(len(slots) > 0)
        self.assertEqual(slots[0]['start'], '11:30')

    def test_min_booking_lead_time(self):
        """Ограничитель: слоты не раньше чем через N часов от 'сейчас'"""
        from unittest.mock import patch
        from datetime import datetime as real_datetime

        self.master.min_booking_lead_time = 2  # 2 часа
        self.master.save()

        today = date.today()

        # "Замораживаем" время внутри schedule_utils на 10:00
        frozen_now = real_datetime(today.year, today.month, today.day, 10, 0, 0)

        class FrozenDateTime(real_datetime):
            @classmethod
            def now(cls, tz=None):
                return frozen_now

        with patch('masters.utils.schedule_utils.datetime', FrozenDateTime):
            slots = self.calc.generate_time_slots(today, 60)

        # Тест не должен проходить холостым
        self.assertGreater(
            len(slots), 0,
            "Слоты не сгенерированы — тест холостой, проверь рабочий день"
        )

        def to_mins(t_str):
            h, m = map(int, t_str.split(':'))
            return h * 60 + m

        # "Сейчас" 10:00, лид-тайм 2ч => минимум 12:00
        self.assertGreaterEqual(
            to_mins(slots[0]['start']), to_mins('12:00'),
            f"Первый слот {slots[0]['start']} раньше 12:00 — лид-тайм не соблюдён"
        )



class MidnightScheduleTest(TestCase):
    """
    Тесты расчёта слотов на границе суток.

    Рабочий день 00:00–23:59, чтобы покрыть и раннее утро, и поздний вечер.
    """

    def setUp(self):
        self.master = create_master()
        self.master.work_mode = 'away'
        self.master.away_travel_time_before_default = 0
        self.master.away_travel_time_after_default = 0
        self.master.arrival_window_minutes = 0
        self.master.save()

        self.service = create_service(self.master, duration=240)  # 4 часа

        from ..models import AwaySchedule
        for day in range(7):
            AwaySchedule.objects.create(
                master=self.master, day_of_week=day,
                start_time=time(0, 0), end_time=time(23, 59), is_working=True
            )

        self.test_date = get_next_monday()
        self.calc = ScheduleCalculator(self.master)

    def test_yesterday_booking_does_not_block_today(self):
        """A: бронь вчера 23:00 на 4 часа не должна блокировать сегодня"""
        from datetime import timedelta
        yesterday = self.test_date - timedelta(days=1)

        Booking.objects.create(
            master=self.master, service=self.service,
            client_name='Вчерашний', encrypted_phone=b'fake',
            date=yesterday, time=time(23, 0),
            status='confirmed', service_mode='away',
            travel_time_before=0, travel_time_after=0
        )

        slots = self.calc.generate_time_slots(self.test_date, 60)

        self.assertGreater(len(slots), 0, "Сегодня не должно быть блокировок от вчера")
        self.assertEqual(slots[0]['start'], '00:00')

    def test_today_late_booking_blocks_evening(self):
        """
        B: бронь сегодня 22:00 на 4 часа (до 02:00 завтра).
        Слоты на сегодня до 22:00 должны быть, после — нет.
        Сейчас (с багом) end_dt.time() = '02:00', range(22:00, 02:00) пуст,
        и бронь НЕ блокирует вечер. Тест это поймает.
        """
        Booking.objects.create(
            master=self.master, service=self.service,
            client_name='Поздний', encrypted_phone=b'fake',
            date=self.test_date, time=time(22, 0),
            status='confirmed', service_mode='away',
            travel_time_before=0, travel_time_after=0
        )

        # Ищем слот на 22:00 и позже — их не должно быть
        # (услуга 60 мин, бронь занимает 22:00–02:00)
        slots = self.calc.generate_time_slots(self.test_date, 60)

        late_slots = [s for s in slots if s['start'] >= '22:00']
        self.assertEqual(
            len(late_slots), 0,
            f"Слоты после 22:00 не должны быть свободны, но найдены: "
            f"{[s['start'] for s in late_slots]}"
        )

        # И слот 21:00 (за час до брони) должен быть
        early_slots = [s for s in slots if s['start'] <= '21:00']
        self.assertGreater(len(early_slots), 0, "До 22:00 слоты должны быть")

    def test_travel_before_goes_to_yesterday(self):
        """
        C: бронь сегодня 00:30, дорога до 60 мин → busy начинается вчера 23:30.
        Обрезка start_dt до 00:00 сегодня должна оставить занятость 00:00–02:30
        (услуга 4 часа → 00:30 + 4ч = 04:30... стоп, услуга 240 мин = 4 часа).

        Возьмём услугу 60 мин: 00:30 + 60 = 01:30. Плюс travel_after 0, arrival 0.
        busy = [вчера 23:30, сегодня 01:30]. После обрезки: [00:00, 01:30].
        Значит, слоты 00:00–01:30 должны быть заняты.
        """
        # Пересоздаём сервис под 60 минут
        from ..models import Service
        Service.objects.filter(master=self.master).delete()
        short_service = create_service(self.master, duration=60)

        Booking.objects.create(
            master=self.master, service=short_service,
            client_name='Ранний', encrypted_phone=b'fake',
            date=self.test_date, time=time(0, 30),
            status='confirmed', service_mode='away',
            travel_time_before=60, travel_time_after=0
        )

        slots = self.calc.generate_time_slots(self.test_date, 60)

        # Слоты, которые попадают внутрь [00:00, 01:30] — не должны быть свободны
        inside = [s for s in slots if s['start'] < '01:30']
        self.assertEqual(
            len(inside), 0,
            f"Слоты до 01:30 должны быть заняты (бронь 00:30 + дорога до 60 мин), "
            f"но найдены: {[s['start'] for s in inside]}"
        )