"""
Расчёт свободного времени мастера.

Поддерживает два режима:
- 'home' — домашний (Schedule + ExtraWorkingDay + Break + ExtraWorkingDayBreak)
- 'away' — выездной (AwaySchedule + AwayExtraDay), с учётом дороги и буферов
"""
from datetime import datetime, time, timedelta, date
from typing import List

from ..models import (
    Master,
    Schedule,
    DayOff,
    Booking,
    ExtraWorkingDay,
    AwaySchedule,
    AwayExtraDay,
    AwayDayOff,
)


class ScheduleCalculator:
    """Класс для расчёта свободного времени мастера."""

    def __init__(self, master: Master):
        self.master = master

    # ============================================================
    # ДОМАШНИЙ РЕЖИМ
    # ============================================================

    def get_home_working_hours_for_date(self, target_date: date):
        """
        Рабочие часы мастера в домашнем режиме.
        Приоритет: DayOff > ExtraWorkingDay > Schedule.
        """
        if DayOff.objects.filter(master=self.master, date=target_date).exists():
            return None

        extra_day = ExtraWorkingDay.objects.filter(
            master=self.master, date=target_date
        ).first()
        if extra_day:
            return (extra_day.start_time, extra_day.end_time)

        day_of_week = target_date.weekday()
        schedule = Schedule.objects.filter(
            master=self.master, day_of_week=day_of_week
        ).first()
        if schedule:
            return (schedule.start_time, schedule.end_time)

        return None

    def get_home_breaks_for_date(self, target_date: date):
        """Перерывы в домашнем режиме (минуты от начала дня)."""
        def to_min(t: time) -> int:
            return t.hour * 60 + t.minute

        # 1. Дополнительный рабочий день
        extra_day = ExtraWorkingDay.objects.filter(
            master=self.master, date=target_date
        ).first()
        if extra_day:
            return [
                (to_min(s), to_min(e))
                for s, e in extra_day.breaks.all().values_list('start_time', 'end_time')
            ]

        # 2. Регулярное расписание
        day_of_week = target_date.weekday()
        schedule = Schedule.objects.filter(
            master=self.master, day_of_week=day_of_week
        ).first()
        if schedule:
            return [
                (to_min(s), to_min(e))
                for s, e in schedule.breaks.all().values_list('start_time', 'end_time')
            ]

        return []


    def get_away_breaks_for_date(self, target_date: date):
        """Перерывы в выездном режиме (минуты от начала дня)."""
        def to_min(t):
            return t.hour * 60 + t.minute

        # 1. Дополнительный выездной день
        extra_day = AwayExtraDay.objects.filter(
            master=self.master, date=target_date
        ).first()
        if extra_day:
            return [
                (to_min(s), to_min(e))
                for s, e in extra_day.breaks.all().values_list('start_time', 'end_time')
            ]

        # 2. Регулярное расписание выездов
        day_of_week = target_date.weekday()
        schedule = AwaySchedule.objects.filter(
            master=self.master, day_of_week=day_of_week, is_working=True
        ).first()
        if schedule:
            return [
                (to_min(s), to_min(e))
                for s, e in schedule.breaks.all().values_list('start_time', 'end_time')
            ]

        return []

    # ============================================================
    # ВЫЕЗДНОЙ РЕЖИМ
    # ============================================================

    def get_away_working_hours_for_date(self, target_date: date):
        """
        Рабочие часы мастера в выездном режиме.
        Приоритет: AwayDayOff > AwayExtraDay > AwaySchedule.
        """
        if AwayDayOff.objects.filter(master=self.master, date=target_date).exists():
            return None
        ...

        extra_day = AwayExtraDay.objects.filter(
            master=self.master, date=target_date
        ).first()
        if extra_day:
            return (extra_day.start_time, extra_day.end_time)

        day_of_week = target_date.weekday()
        schedule = AwaySchedule.objects.filter(
            master=self.master, day_of_week=day_of_week, is_working=True
        ).first()
        if schedule:
            return (schedule.start_time, schedule.end_time)

        return None

    # ============================================================
    # ОБЩЕЕ
    # ============================================================

    def is_away_mode(self) -> bool:
        """Выездной ли мастер."""
        return self.master.work_mode == 'away'

    def get_working_hours_for_date(self, target_date: date):
        """Рабочие часы с учётом режима мастера."""
        if self.is_away_mode():
            return self.get_away_working_hours_for_date(target_date)
        return self.get_home_working_hours_for_date(target_date)

    def get_breaks_for_date(self, target_date: date):
        """Перерывы (в обоих режимах)."""
        if self.is_away_mode():
            return self.get_away_breaks_for_date(target_date)
        return self.get_home_breaks_for_date(target_date)

    # ============================================================
    # ЗАНЯТЫЕ СЛОТЫ
    # ============================================================

    def get_booked_slots_for_date(self, target_date: date):
        """
        Занятые интервалы на дату.

        home: [time, time + service + extra]
        away: [time - travel_before, time + arrival_window + service + extra + travel_after]
            (дорога после ВХОДИТ в busy — резервирует время до следующего клиента)

        Возвращает [(start_time, end_time, booking_id, travel_after)].
        """
        bookings = Booking.objects.filter(
            master=self.master,
            date=target_date,
            status__in=['confirmed', 'pending'],
        ).select_related('service')

        booked_slots = []
        for booking in bookings:
            base_duration = (booking.service.duration if booking.service else 0)
            extra = booking.duration_extra_minutes or 0
            duration = base_duration + extra

            start_dt = datetime.combine(date.today(), booking.time)
            # Добавляем ситуативные паузы
            start_dt -= timedelta(minutes=booking.buffer_before_minutes or 0)
            
            end_dt = start_dt + timedelta(minutes=duration)
            end_dt += timedelta(minutes=booking.buffer_after_minutes or 0)

            travel_after = 0
            if self.is_away_mode():
                before = booking.travel_time_before or 0
                travel_after = booking.travel_time_after or 0
                arrival_window = self.master.arrival_window_minutes or 0
                
                start_dt = start_dt - timedelta(minutes=before)
                end_dt = end_dt + timedelta(minutes=arrival_window + travel_after)
            else:
                # Добавляем постоянный буфер для дома
                end_dt += timedelta(minutes=self.master.home_buffer_between_bookings or 0)

            if start_dt.date() < date.today():
                start_dt = datetime.combine(date.today(), time(0, 0))

            booked_slots.append((
                start_dt.time(),
                end_dt.time(),
                booking.id,
                travel_after,
            ))

        return booked_slots

    # ============================================================
    # ГЕНЕРАЦИЯ СЛОТОВ
    # ============================================================

    def generate_time_slots(
        self,
        target_date: date,
        service_duration: int,
        slot_step: int = 15,
        exclude_booking_id: int = None,
        current_time: time = None,
        original_booking_id: int = None,
        travel_before_override: int = None,
        travel_after_override: int = None,
    ):
        """
        Генерирует свободные слоты (интервалы приезда).

        home: слот = [A, A + service_duration].

        away: слот = [A, A + W] (интервал приезда).
              Проверка занятости:
                1) [A, A + W + service + extra + travel_after_new] не пересекается с чужим busy.
                2) Для каждой записи i: A >= service_end_i + travel_before_new.
                   (Мастер едет от адреса предыдущего клиента).
              Шаг слотов = arrival_window (W). Если W = 0 → шаг 15.
        """
        working_hours = self.get_working_hours_for_date(target_date)
        if not working_hours:
            return []

        start_work, end_work = working_hours

        def time_to_minutes(t: time) -> int:
            return t.hour * 60 + t.minute

        start_minutes = time_to_minutes(start_work)
        end_minutes = time_to_minutes(end_work)

        is_away = self.is_away_mode()

        # ---- Параметры away ----
        arrival_window = 0
        travel_before_new = 0
        travel_after_new = 0
        if is_away:
            arrival_window = self.master.arrival_window_minutes or 0
            if arrival_window < 0:
                arrival_window = 0
            if arrival_window > 120:
                arrival_window = 120

            if travel_before_override is not None:
                travel_before_new = travel_before_override
            else:
                travel_before_new = self.master.away_travel_time_before_default or 0

            if travel_after_override is not None:
                travel_after_new = travel_after_override
            else:
                travel_after_new = self.master.away_travel_time_after_default or 0

            if arrival_window > 0:
                slot_step = arrival_window
            else:
                slot_step = 15

        # ---- Длительность проверки и отображения ----
        if is_away:
            check_duration = arrival_window + service_duration + travel_after_new
        else:
            check_duration = service_duration

        slot_display_duration = arrival_window if is_away else service_duration

        # ---- current_time ----
    
        # Учитываем ограничитель (Lead Time) и текущее время
        lead_time_hours = self.master.min_booking_lead_time or 0
        now = datetime.now()
        
        # Определяем минимальное время начала (в минутах от начала дня)
        if lead_time_hours > 0:
            min_start_dt = now + timedelta(hours=lead_time_hours)
        else:
            min_start_dt = now if current_time else None

        if min_start_dt:
            if target_date > min_start_dt.date():
                # Целевая дата в будущем, ограничений по времени нет
                pass
            elif target_date == min_start_dt.date():
                current_minutes = min_start_dt.hour * 60 + min_start_dt.minute
                current_minutes = (
                    (current_minutes + slot_step - 1) // slot_step
                ) * slot_step
                start_minutes = max(start_minutes, current_minutes)
            else:
                # Целевая дата в прошлом
                return []

        # ---- Перерывы ----
        breaks = self.get_breaks_for_date(target_date)

        # ---- Занятые интервалы: (busy_start, busy_end, F_i, booking_id) ----
        booked_slots = []
        for start, end, booking_id, travel_after_i in self.get_booked_slots_for_date(target_date):
            if exclude_booking_id and booking_id == exclude_booking_id:
                continue
            booked_slots.append((
                time_to_minutes(start),
                time_to_minutes(end),
                travel_after_i,
                booking_id,
            ))

        # ---- Разблокируем исходную запись (при редактировании) ----
        if original_booking_id:
            try:
                original_booking = Booking.objects.get(
                    id=original_booking_id, master=self.master
                )
                original_start = time_to_minutes(original_booking.time)
                base = original_booking.service.duration if original_booking.service else 0
                extra = original_booking.duration_extra_minutes or 0
                original_end = original_start + base + extra
                if is_away:
                    original_start -= (original_booking.travel_time_before or 0)
                    original_end += (
                        arrival_window
                        + (original_booking.travel_time_after or 0)
                    )

                booked_slots = [
                    (s, e, ta, bid) for (s, e, ta, bid) in booked_slots
                    if not (abs(s - original_start) <= 1 and abs(e - original_end) <= 1)
                ]
            except Booking.DoesNotExist:
                pass

        # ---- busy_minutes (стандартная проверка 1) ----
        busy_minutes = [False] * (24 * 60)
        for b_start, b_end in breaks:
            for m in range(b_start, min(b_end, 1440)):
                busy_minutes[m] = True
        for b_start, b_end, _, _ in booked_slots:
            for m in range(b_start, min(b_end, 1440)):
                busy_minutes[m] = True

        # ---- Генерация слотов ----
        all_slots = []
        current = start_minutes

        while current + slot_display_duration <= end_minutes:
            slot_start = current
            slot_display_end = current + slot_display_duration

            is_free = True
            conflict_end = None

            # --- Проверка 1: busy_minutes ---
            check_end = min(slot_start + check_duration, 1440)
            for m in range(slot_start, check_end):
                if busy_minutes[m]:
                    is_free = False
                    m_end = m
                    while m_end < 1440 and busy_minutes[m_end]:
                        m_end += 1
                    conflict_end = m_end
                    break

            # --- Проверка 2 (только away): дорога от конца услуги предыдущего ---
            if is_free and is_away and travel_before_new > 0 and booked_slots:
                for (b_start, b_end, f_i, _) in booked_slots:
                    # Восстанавливаем конец услуги: busy_end - travel_after
                    service_end_i = b_end - f_i
                    # Минимальное время приезда нового клиента
                    min_a = service_end_i + travel_before_new

                    if slot_start < min_a:
                        is_free = False
                        if conflict_end is None or min_a > conflict_end:
                            conflict_end = min_a
                        break

            if is_free:
                start_time_str = f"{slot_start // 60:02d}:{slot_start % 60:02d}"
                # Для дома end не нужен (клиент приходит к точке), для away - интервал приезда
                end_time_str = f"{slot_display_end // 60:02d}:{slot_display_end % 60:02d}" if is_away else ''
                
                all_slots.append({
                    'start': start_time_str,
                    'end': end_time_str,
                    'start_minutes': slot_start,
                    'end_minutes': slot_display_end,
                    'display': start_time_str,
                    'id': len(all_slots),
                })
                current += slot_step
                
            else:
                if conflict_end is None:
                    conflict_end = slot_start + slot_step
                current = max(conflict_end, slot_start + 1)
                current = ((current + slot_step - 1) // slot_step) * slot_step

        return all_slots

    # ============================================================
    # ДОСТУПНЫЕ ДАТЫ
    # ============================================================

    def get_available_dates(
        self, days_ahead: int = 60, min_service_duration: int = 30
    ) -> List[date]:
        """Даты, где есть хотя бы один свободный слот."""
        available_dates = []
        today = date.today()
        now = datetime.now().time()

        for i in range(days_ahead):
            check_date = today + timedelta(days=i)

            working_hours = self.get_working_hours_for_date(check_date)
            if not working_hours:
                continue

            current_time = now if check_date == today else None

            slots = self.generate_time_slots(
                check_date,
                min_service_duration,
                current_time=current_time,
            )
            if slots:
                available_dates.append(check_date)

        return available_dates

    # ============================================================
    # НЕСКОЛЬКО УСЛУГ
    # ============================================================

    def generate_time_slots_for_multiple_services(
        self,
        target_date: date,
        services_durations: List[int],
        slot_step: int = 15,
        exclude_booking_ids: List[int] = None,
        current_time: time = None,
    ):
        total_duration = sum(services_durations)
        return self.generate_time_slots(
            target_date,
            total_duration,
            slot_step,
            exclude_booking_id=exclude_booking_ids[0] if exclude_booking_ids else None,
            current_time=current_time,
        )