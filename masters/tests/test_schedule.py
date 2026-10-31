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
            """Ограничитель: сегодняшние слоты не раньше чем через N часов"""
            from django.utils import timezone
            self.master.min_booking_lead_time = 2 # 2 часа
            self.master.save()
            
            today = date.today()
            now = timezone.localtime(timezone.now()).time()
            
            # Вызываем генерацию на сегодня
            slots = self.calc.generate_time_slots(today, 60)
            
            if len(slots) > 0:
                # Переводим строку "HH:MM" в минуты для сравнения
                def to_mins(t_str):
                    h, m = map(int, t_str.split(':'))
                    return h * 60 + m
                    
                slot_min = to_mins(slots[0]['start'])
                now_min = now.hour * 60 + now.minute
                expected_min = now_min + 120 # +2 часа
                
                # Слот должен быть больше или равен ожидаемому
                self.assertTrue(slot_min >= expected_min, f"Слот {slots[0]['start']} меньше ожидаемого (сейчас {now}, нужно >= {expected_min})")