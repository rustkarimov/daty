// frontend/src/components/Dashboard/Calendar/DateGrid.jsx
//
// Сетка карточек дат.
// Используется в AddBookingModal, EditBookingModal, ClientFormStep.

import React from 'react';
import shared from './BookingModalShared.module.css';

/**
 * @param {Object} props
 * @param {Array} props.dates — [{ date, display, day_of_week }]
 * @param {string} props.selectedDate
 * @param {Function} props.onSelect — (dateStr) => void
 * @param {boolean} props.loading
 * @param {boolean} [props.hasMore]
 * @param {Function} [props.onLoadMore]
 * @param {boolean} [props.loadingMore]
 */
export default function DateGrid({
    dates,
    selectedDate,
    onSelect,
    loading,
    hasMore = false,
    onLoadMore,
    loadingMore = false,
}) {
    if (loading) {
        return (
            <div className={shared.loading}>
                <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
            </div>
        );
    }

    return (
        <>
            <div className={shared.dateGrid}>
                {dates.map(d => (
                    <div
                        key={d.date}
                        className={`${shared.dateCard} ${selectedDate === d.date ? shared.dateCardSelected : ''}`}
                        onClick={() => onSelect(d.date)}
                    >
                        <div className={shared.dateCardWeekday}>{d.day_of_week}</div>
                        <div className={shared.dateCardDay}>{d.display}</div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        style={{
                            borderRadius: 20,
                            padding: '6px 20px',
                            fontSize: '0.8rem',
                        }}
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
    );
}