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
        """Перерывы (только в домашнем режиме)."""
        if self.is_away_mode():
            return []
        return self.get_home_breaks_for_date(target_date)

    # ============================================================
    # ЗАНЯТЫЕ СЛОТЫ
    # ============================================================

    def get_booked_slots_for_date(self, target_date: date):
        """
        Занятые слоты на дату (учитываем полную длительность — для выезда).
        Возвращает [(start, end, booking_id)].
        """
        bookings = Booking.objects.filter(
            master=self.master,
            date=target_date,
            status__in=['confirmed', 'pending'],  # pending тоже блокирует
        ).select_related('service')

        booked_slots = []
        for booking in bookings:
            start = booking.time
            duration = booking.total_duration_minutes  # ← учитываем буферы
            end = (datetime.combine(date.today(), start) +
                   timedelta(minutes=duration)).time()
            booked_slots.append((start, end, booking.id))
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
    ):
        """
        Генерирует свободные слоты.

        Для выездного режима service_duration автоматически расширяется
        на travel_time_default + buffer_before + buffer_after.
        """
        working_hours = self.get_working_hours_for_date(target_date)
        if not working_hours:
            return []

        start_work, end_work = working_hours

        def time_to_minutes(t: time) -> int:
            return t.hour * 60 + t.minute

        start_minutes = time_to_minutes(start_work)
        end_minutes = time_to_minutes(end_work)

        # ---- Для выезда: добавляем время на дорогу (туда и обратно) ----
        full_duration = service_duration
        if self.is_away_mode():
            travel = self.master.away_travel_time_default or 0
            full_duration = service_duration + travel + travel

        # Если передан current_time (для сегодняшнего дня) — начинаем с текущего
        if current_time:
            current_minutes = time_to_minуutes(current_time)
            current_minutes = (
                (current_minutes + slot_step - 1) // slot_step
            ) * slot_step
            start_minutes = max(start_minutes, current_minutes)

        if start_minutes >= end_minutes:
            return []

        # ---- Перерывы ----
        breaks = self.get_breaks_for_date(target_date)

        # ---- Занятые слоты ----
        booked_slots = []
        for start, end, booking_id in self.get_booked_slots_for_date(target_date):
            if exclude_booking_id and booking_id == exclude_booking_id:
                continue
            booked_slots.append((time_to_minutes(start), time_to_minutes(end)))

        # ---- Временно разблокируем исходную запись (при редактировании) ----
        if original_booking_id:
            try:
                original_booking = Booking.objects.get(
                    id=original_booking_id, master=self.master
                )
                original_start = time_to_minutes(original_booking.time)
                original_end = original_start + original_booking.total_duration_minutes

                booked_slots = [
                    (s, e) for (s, e) in booked_slots
                    if not (abs(s - original_start) <= 1 and abs(e - original_end) <= 1)
                ]
            except Booking.DoesNotExist:
                pass

        # ---- Массив занятых минут ----
        busy_minutes = [False] * (24 * 60)
        for b_start, b_end in breaks:
            for m in range(b_start, min(b_end, 1440)):
                busy_minutes[m] = True
        for b_start, b_end in booked_slots:
            for m in range(b_start, min(b_end, 1440)):
                busy_minutes[m] = True

        # ---- Генерация слотов ----
        all_slots = []
        current = start_minutes

        while current + full_duration <= end_minutes:
            slot_start = current
            slot_end = current + full_duration

            is_free = True
            for m in range(slot_start, min(slot_end, 1440)):
                if busy_minutes[m]:
                    is_free = False
                    m_end = m
                    while m_end < 1440 and busy_minutes[m_end]:
                        m_end += 1
                    current = m_end
                    break

            if is_free:
                start_time_str = f"{slot_start // 60:02d}:{slot_start % 60:02d}"
                all_slots.append({
                    'start': start_time_str,
                    'end': f"{slot_end // 60:02d}:{slot_end % 60:02d}",
                    'start_minutes': slot_start,
                    'end_minutes': slot_end,
                    'display': start_time_str,
                    'id': len(all_slots),
                })
                current += slot_step

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