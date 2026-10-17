import React, { useState, useEffect } from 'react';
import { loadAvailableDates } from '../../api/publicBooking';
import styles from './DatesStep.module.css';

const DATES_LIMIT = 30;

export default function DatesStep({ identifier, selectedServices, selectedDate, onChange }) {
    const [dates, setDates] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        loadAvailableDates(identifier, totalDuration, 1, DATES_LIMIT)
            .then(data => {
                setDates(data.dates || []);
                setHasMore(!!data.has_more);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки дат:', error);
                setLoading(false);
            });
    }, [identifier, totalDuration]);

    function handleLoadMore() {
        const nextPage = page + 1;
        setLoadingMore(true);
        loadAvailableDates(identifier, totalDuration, nextPage, DATES_LIMIT)
            .then(data => {
                setDates(prev => [...prev, ...(data.dates || [])]);
                setHasMore(!!data.has_more);
                setPage(nextPage);
                setLoadingMore(false);
            })
            .catch(error => {
                console.error('Ошибка догрузки дат:', error);
                setLoadingMore(false);
            });
    }

    return (
        <div className="card mb-4">
            <div className="card-header bg-white">
                <h5 className="mb-0">
                    <i className="far fa-calendar-alt me-2" style={{ color: 'var(--primary)' }} />
                    Шаг 2: Выберите дату
                </h5>
            </div>
            <div className="card-body">
                {loading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : dates.length === 0 ? (
                    <p className="text-muted text-center">Нет свободных дат для выбранных услуг</p>
                ) : (
                    <>
                        <div className="row">
                            {dates.map(d => (
                                <div key={d.date} className="col-4 col-md-3 mb-3">
                                    <div
                                        className={`${styles.dateCard} ${selectedDate === d.date ? styles.selected : ''}`}
                                        onClick={() => onChange(d.date)}
                                    >
                                        <div className={styles.weekday}>{d.day_of_week}</div>
                                        <div className={styles.day}>{d.display}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {hasMore && (
                            <div className="text-center mt-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin me-1" />
                                            Загрузка...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-chevron-down me-1" />
                                            Показать ещё
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}