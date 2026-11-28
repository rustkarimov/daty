import React, { useState, useEffect, useCallback } from 'react';
import MonthGrid from './MonthGrid';
import DayModal from './DayModal';
import { loadCalendar, loadCounts } from '../../../api/calendar';
import styles from './Calendar.module.css';


const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function Calendar({ masterSlug, masterMode = 'home', onExternalChange }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [countsData, setCountsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const [legendOpen, setLegendOpen] = useState(false);

    const reloadData = useCallback(() => {
        setLoading(true);
        Promise.all([loadCalendar(), loadCounts()])
            .then(([calendar, counts]) => {
                setCalendarData(calendar);
                setCountsData(counts);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки календаря:', error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        reloadData();
    }, [reloadData]);

    function changeMonth(delta) {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    }

    function handleDayClick(dateStr) {
        setSelectedDate(dateStr);
    }

    function handleCloseModal() {
        setSelectedDate(null);
    }

    function handleDataChanged(message) {
        reloadData();
        if (onExternalChange) onExternalChange(message);
    }

    return (
        <div className={styles.calendar}>
            <div className={styles.nav}>
                <button className={styles.navBtn} onClick={() => changeMonth(-1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <span className={styles.navTitle}>
                    {MONTH_NAMES[month]} {year}
                </span>
                <button className={styles.navBtn} onClick={() => changeMonth(1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>
                    <div className="spinner-border" style={{ color: '#4053d3' }} />
                </div>
            ) : (
                <MonthGrid
                    year={year}
                    month={month}
                    calendarData={calendarData}
                    countsData={countsData}
                    onDayClick={handleDayClick}
                />
            )}

            <div className={styles.legendWrapper}>
                    <button 
                        className={styles.legendToggle} 
                        onClick={() => setLegendOpen(!legendOpen)}
                        title="Показать легенду"
                    >
                        <i className="fas fa-info-circle" />
                        <i className={`fas fa-chevron-${legendOpen ? 'up' : 'down'}`} style={{ marginLeft: '4px', fontSize: '10px' }} />
                    </button>
                
                {legendOpen && (
                    <div className={styles.legendContent}>
                        <div className={styles.legendItem}>
                            <div className={`${styles.legendIcon} ${styles.legendWorking}`}></div>
                            <span>Рабочий день</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={`${styles.legendIcon} ${styles.legendDayOff}`}></div>
                            <span>Выходной</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={`${styles.legendIcon} ${styles.legendVacation}`}></div>
                            <span>Отпуск</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendBadge}>3</span>
                            <span>Записи (количество)</span>
                        </div>
                        <div className={styles.legendItem}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Есть перерыв</span>
                        </div>
                    </div>
                )}
            </div>

            {selectedDate && (
                <DayModal
                    dateStr={selectedDate}
                    masterSlug={masterSlug}
                    masterMode={masterMode}
                    onClose={handleCloseModal}
                    onDataChanged={handleDataChanged}
                />
            )}
        </div>
    );
}