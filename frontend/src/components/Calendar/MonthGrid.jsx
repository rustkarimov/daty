import React from 'react';
import DayCell from './DayCell';

export default function MonthGrid({ year, month, calendarData, countsData, onDayClick }) {
    // year — 2026
    // month — 0-11 (0=январь)
    // calendarData — данные из /api/schedule/calendar/
    // countsData — данные из /api/bookings/counts/
    // onDayClick — что делать при клике на день

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay(); // 0=Вс, 1=Пн, ...

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Сдвиг для Пн-первого дня недели
    const adjustedStartWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

    // Пустые ячейки в начале
    const emptyCells = [];
    for (let i = 0; i < adjustedStartWeekday; i++) {
        emptyCells.push(<div key={`empty-${i}`} className="calendar-date empty" />);
    }

    // Функция для определения статуса дня
    function getDayStatus(day) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay();
        const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const extraDay = calendarData?.extra_days?.[dateStr];
        const schedule = calendarData?.schedules?.[dayIdx];
        const isDayOff = calendarData?.days_off?.includes(dateStr);

        let workingClass = '';
        let statusText = '';
        let hasBreaks = false;

        if (isDayOff) {
            workingClass = 'non-working';
        } else if (extraDay) {
            workingClass = 'working';
            statusText = `${extraDay.start} - ${extraDay.end}`;
            if (extraDay.breaks?.length > 0) hasBreaks = true;
        } else if (schedule) {
            workingClass = 'working';
            statusText = `${schedule.start} - ${schedule.end}`;
            if (schedule.breaks?.length > 0) hasBreaks = true;
        } else {
            workingClass = 'non-working';
        }

        return { workingClass, statusText, hasBreaks };
    }

    // Ячейки с днями
    const dayCells = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const currentDate = new Date(year, month, d);
        const isPast = currentDate < today;
        const isToday = currentDate.toDateString() === today.toDateString();

        const status = getDayStatus(d);
        const bookingCount = countsData?.counts?.[dateStr] || 0;

        dayCells.push(
            <DayCell
                key={dateStr}
                day={d}
                dateStr={dateStr}
                status={status}
                bookingCount={bookingCount}
                hasBreaks={status.hasBreaks}
                isToday={isToday}
                isPast={isPast}
                onClick={onDayClick}
            />
        );
    }

    return (
        <>
            <div className="calendar-weekdays">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                    <div key={d} className="calendar-weekday">{d}</div>
                ))}
            </div>
            <div className="calendar-dates">
                {emptyCells}
                {dayCells}
            </div>
        </>
    );
}