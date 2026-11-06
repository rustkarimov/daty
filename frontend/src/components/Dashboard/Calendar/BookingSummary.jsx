// frontend/src/components/Dashboard/Calendar/BookingSummary.jsx
//
// Сводка выбранных услуг + дата/время.
// Используется в AddBookingModal, EditBookingModal, ClientFormStep.

import React from 'react';
import shared from './BookingModalShared.module.css';
import { formatDate } from '../../../utils/date';

/**
 * @param {Object} props
 * @param {Array} props.services — [{ id, name, duration, price }]
 * @param {string} props.date
 * @param {string} props.time
 * @param {string} [props.slotEnd]
 * @param {number} props.totalDuration
 * @param {number} props.totalPrice
 * @param {React.Ref} [props.innerRef] — для скролла
 * @param {boolean} [props.single] — если true, заголовок «Услуга» вместо «Выбранные услуги»
 */
export default function BookingSummary({
    services,
    date,
    time,
    slotEnd,
    totalDuration,
    totalPrice,
    innerRef,
    single = false,
}) {
    const timeLabel = slotEnd && slotEnd !== time
        ? `${time}—${slotEnd}`
        : time;

    return (
        <div className={shared.summaryBox} ref={innerRef}>
            <div className={shared.summaryTitle}>
                <i className="fas fa-list" />
                {single ? 'Услуга' : 'Выбранные услуги'}
            </div>

            {services.map(s => (
                <div key={s.id} className={shared.summaryRow}>
                    <span>{s.name}</span>
                    <span className={shared.summaryRowMeta}>
                        {s.duration} мин · {s.price} ₽
                    </span>
                </div>
            ))}

            {!single && (
                <div className={shared.summaryTotal}>
                    <span>Итого</span>
                    <span className={shared.summaryTotalValue}>
                        {totalDuration} мин · {totalPrice} ₽
                    </span>
                </div>
            )}

            <div className={shared.summaryMeta}>
                <span className={shared.summaryMetaItem}>
                    <i className="far fa-calendar-alt" />
                    {formatDate(date)}
                </span>
                <span className={shared.summaryMetaItem}>
                    <i className="far fa-clock" />
                    {timeLabel}
                </span>
            </div>
        </div>
    );
}