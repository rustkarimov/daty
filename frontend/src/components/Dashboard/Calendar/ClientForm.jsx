// frontend/src/components/Dashboard/Calendar/ClientForm.jsx
//
// Поля клиента: имя, телефон, комментарий + (опционально) away-поля.
// Используется в AddBookingModal, EditBookingModal, ClientFormStep.

import React from 'react';
import shared from './BookingModalShared.module.css';
import { phoneMask } from '../../../utils/phoneMask';

/**
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.phone
 * @param {string} props.comment
 * @param {Function} props.onNameChange
 * @param {Function} props.onPhoneChange
 * @param {Function} props.onCommentChange
 * @param {boolean} [props.isAway]
 * @param {string} [props.address]
 * @param {Function} [props.onAddressChange]
 * @param {number|string} [props.travelBefore]
 * @param {Function} [props.onTravelBeforeChange]
 * @param {number|string} [props.travelAfter]
 * @param {Function} [props.onTravelAfterChange]
 * @param {number|string} [props.durationExtra]
 * @param {Function} [props.onDurationExtraChange]
 */
export default function ClientForm({
    name,
    phone,
    comment,
    onNameChange,
    onPhoneChange,
    onCommentChange,
    isAway = false,
    address = '',
    onAddressChange,
    travelBefore = 0,
    onTravelBeforeChange,
    travelAfter = 0,
    onTravelAfterChange,
    durationExtra = 0,
    onDurationExtraChange,
    showAwayFields = true,
}) {
    return (
        <>
            <input
                type="text"
                className={shared.formInput}
                placeholder="Имя клиента"
                value={name}
                onChange={e => onNameChange(e.target.value)}
            />
            <input
                type="tel"
                className={shared.formInput}
                placeholder="7 999 123-45-67"
                value={phone}
                onChange={e => onPhoneChange(phoneMask(e.target.value))}
            />

            {isAway && (
                <>
                    <input
                        type="text"
                        className={shared.formInput}
                        placeholder="Адрес клиента (куда ехать)"
                        value={address}
                        onChange={e => onAddressChange(e.target.value)}
                    />

                    {showAwayFields && (
                        <>
                            <div className={shared.twoCols}>
                                <div className={shared.col}>
                                    <label className={shared.miniLabel}>Время до (мин)</label>
                                    <input
                                        type="number"
                                        className={shared.formInput}
                                        min="0"
                                        step="5"
                                        value={travelBefore}
                                        onChange={e => onTravelBeforeChange(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className={shared.col}>
                                    <label className={shared.miniLabel}>Время после (мин)</label>
                                    <input
                                        type="number"
                                        className={shared.formInput}
                                        min="0"
                                        step="5"
                                        value={travelAfter}
                                        onChange={e => onTravelAfterChange(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={shared.miniLabel}>Доп. минуты к услуге</label>
                                <input
                                    type="number"
                                    className={shared.formInput}
                                    min="0"
                                    step="5"
                                    value={durationExtra}
                                    onChange={e => onDurationExtraChange(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            <textarea
                className={shared.formTextarea}
                rows="2"
                placeholder="Комментарий (необязательно)"
                value={comment}
                onChange={e => onCommentChange(e.target.value)}
            />
        </>
    );
}