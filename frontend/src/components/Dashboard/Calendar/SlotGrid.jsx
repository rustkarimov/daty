// frontend/src/components/Dashboard/Calendar/SlotGrid.jsx
//
// Сетка карточек слотов.
// Используется в AddBookingModal, EditBookingModal, ClientFormStep.

import React from 'react';
import shared from './BookingModalShared.module.css';

/**
 * @param {Object} props
 * @param {Array} props.slots — [{ start, end? }]
 * @param {string} props.selectedTime
 * @param {Function} props.onSelect — (slot) => void
 * @param {boolean} props.loading
 * @param {Function} [props.renderLabel] — (slot) => string. По умолчанию: slot.start
 */
export default function SlotGrid({
    slots,
    selectedTime,
    onSelect,
    loading,
    renderLabel = slot => slot.start,
}) {
    if (loading) {
        return (
            <div className={shared.loading}>
                <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
            </div>
        );
    }

    if (!slots || slots.length === 0) {
        return <p className={shared.emptyText}>Нет свободных слотов</p>;
    }

    return (
        <div className={shared.slotGrid}>
            {slots.map(slot => (
                <div
                    key={slot.start}
                    className={`${shared.slotCard} ${selectedTime === slot.start ? shared.slotCardSelected : ''}`}
                    onClick={() => onSelect(slot)}
                >
                    {renderLabel(slot)}
                </div>
            ))}
        </div>
    );
}