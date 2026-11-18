import React from 'react';
import styles from './Calendar.module.css';

export default function DayCell({ day, dateStr, status, bookingCount, hasBreaks, isToday, isPast, onClick }) {
    const workingClass = status?.workingClass || '';
    const statusText = status?.statusText || '';
    const isVacation = status?.isVacation || false;

    // Для отпуска скрываем все пометки (перерывы, записи, часы работы)
    const showIcons = !isPast && !isVacation;
    const showTime = !isVacation;

    const className = [
        styles.dateCell,
        workingClass === 'working' ? styles.working : '',
        workingClass === 'non-working' ? styles.nonWorking : '',
        isVacation ? styles.vacation : '',
        isPast ? styles.past : '',
        isToday ? styles.today : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={className} onClick={() => onClick(dateStr)}>
            <span className={styles.dateNumber}>{day}</span>
            {showTime && <div className={styles.dateTime}>{statusText}</div>}
            {showIcons && (
                <div className={styles.icons}>
                    {bookingCount > 0 && (
                        <span className={styles.bookingBadge}>{bookingCount}</span>
                    )}
                    {hasBreaks && (
                        <span className={styles.breakBadge} title="В этот день есть перерывы">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="2.5"
                                 strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}