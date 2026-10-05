import React from 'react';
import styles from './Calendar.module.css';

export default function DayCell({ day, dateStr, status, bookingCount, hasBreaks, isToday, isPast, onClick }) {
    const workingClass = status?.workingClass || '';
    const statusText = status?.statusText || '';
    const showIcons = !isPast;

    const className = [
        styles.dateCell,
        workingClass === 'working' ? styles.working : '',
        workingClass === 'non-working' ? styles.nonWorking : '',
        isPast ? styles.past : '',
        isToday ? styles.today : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={className} onClick={() => onClick(dateStr)}>
            <span className={styles.dateNumber}>{day}</span>
            <div className={styles.dateTime}>{statusText}</div>
            <div className={styles.icons}>
                {showIcons && bookingCount > 0 && (
                    <span className={styles.bookingBadge}>{bookingCount}</span>
                )}
                {showIcons && hasBreaks && (
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
        </div>
    );
}