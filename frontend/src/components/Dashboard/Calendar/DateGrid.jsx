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
 */
export default function DateGrid({ dates, selectedDate, onSelect, loading }) {
    if (loading) {
        return (
            <div className={shared.loading}>
                <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
            </div>
        );
    }

    return (
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
    );
}