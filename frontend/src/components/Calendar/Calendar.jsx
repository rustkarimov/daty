import React, { useState, useEffect, useCallback } from 'react';
import MonthGrid from './MonthGrid';
import DayModal from './DayModal';
import { loadCalendar, loadCounts } from '../../api/calendar';

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [countsData, setCountsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Функция загрузки данных — можно вызвать в любой момент
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

    // Загрузка при монтировании
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

    function handleDataChanged() {
        reloadData();
    }

    return (
        <div>
            <div className="text-center mb-3">
                <button
                    className="btn btn-sm btn-outline-primary calendar-nav-btn"
                    onClick={() => changeMonth(-1)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <span className="mx-3 fw-bold">
                    {MONTH_NAMES[month]} {year}
                </span>
                <button
                    className="btn btn-sm btn-outline-primary calendar-nav-btn"
                    onClick={() => changeMonth(1)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-3">
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

            {selectedDate && (
                <DayModal
                    dateStr={selectedDate}
                    onClose={handleCloseModal}
                    onDataChanged={handleDataChanged}
                />
            )}
        </div>
    );
}