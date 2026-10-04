import React from 'react';

export default function DayCell({ day, dateStr, status, bookingCount, hasBreaks, isToday, isPast, onClick }) {
    // day — число месяца (1-31)
    // dateStr — 'YYYY-MM-DD'
    // status — {workingClass: 'working'|'non-working', statusText: '09:00-18:00'}
    // bookingCount — сколько записей
    // hasBreaks — есть ли перерывы
    // isToday — сегодня ли
    // isPast — прошёл ли день
    // onClick — что делать при клике

    const workingClass = status?.workingClass || '';
    const statusText = status?.statusText || '';
    const showIcons = !isPast;

    const className = [
        'calendar-date',
        workingClass,
        isPast ? 'past' : '',
        isToday ? 'today' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={className} onClick={() => onClick(dateStr)}>
            <span className="date-number">{day}</span>
            <div className="calendar-time">{statusText}</div>
            <div className="calendar-icons">
                {showIcons && bookingCount > 0 && (
                    <span className="booking-badge">{bookingCount}</span>
                )}
                {showIcons && hasBreaks && (
                    <span className="break-badge" title="В этот день есть перерывы">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2.5"
                             strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </span>
                )}
            </div>
        </div>
    );
}