// frontend/src/components/Public/ClientFormStep.jsx
//
// Шаг 4 публичной страницы: ввод данных клиента + сохранение.
// Использует useBookingForm (mode='client') и ClientForm.

import React from 'react';
import useBookingForm from '../Dashboard/Calendar/useBookingForm';
import ClientForm from '../Dashboard/Calendar/ClientForm';
import styles from './ClientFormStep.module.css';
import { formatDate } from '../../utils/date';

export default function ClientFormStep({
    identifier,
    selectedServices,
    selectedDate,
    selectedTime,     // { start, end }
    isAway,
    onSuccess,
}) {
    const startTime = selectedTime?.start || '';

    const form = useBookingForm({
        mode: 'client',
        masterSlug: identifier,
        masterMode: isAway ? 'away' : 'home',
        initialServices: selectedServices,
        initialDate: selectedDate,
        initialTime: startTime,
        onSaved: null,
    });

    const {
        clientName,
        clientPhone,
        clientAddress,
        comment,
        setClientName,
        setClientPhone,
        setClientAddress,
        setComment,
        saving,
        save,
    } = form;

    async function handleSubmit(e) {
        e.preventDefault();
        const data = await save();
        if (data && data.success) {
            onSuccess({
                message: data.data?.message,
                status: data.data?.status,
                is_away: data.data?.is_away,
                bookings: data.data?.bookings || [],
                clientAddress: isAway ? clientAddress.trim() : '',
            });
        }
    }

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    const endTime = selectedTime?.end || '';
    const timeLabel = endTime && endTime !== startTime
        ? `${startTime}—${endTime}`
        : startTime;

    return (
        <div className="card mb-4">
            <div className="card-header bg-white">
                <h5 className="mb-0">
                    <i className="fas fa-pencil-alt me-2" style={{ color: 'var(--primary)' }} />
                    Шаг 4: Ваши данные
                </h5>
            </div>
            <div className="card-body">
                <div className={styles.summary}>
                    <div className={styles.summaryLabel}>
                        <i className="fas fa-list me-1" />
                        Выбранные услуги
                    </div>
                    {selectedServices.map(s => (
                        <div key={s.id} className={styles.summaryItem}>
                            <span>
                                {s.category_name ? `${s.category_name}: ` : ''}{s.name}
                            </span>
                            <span className={styles.summaryMeta}>
                                {s.duration} мин · {s.price} ₽
                            </span>
                        </div>
                    ))}
                    <div className={styles.summaryTotal}>
                        <span>Итого</span>
                        <span>{totalDuration} мин / {totalPrice} ₽</span>
                    </div>
                    <div className="row g-2 mt-2">
                        <div className="col-6">
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabelSmall}>
                                    <i className="far fa-calendar-alt me-1" />Дата
                                </span>
                                <span className={styles.summaryValue}>{formatDate(selectedDate)}</span>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabelSmall}>
                                    <i className="far fa-clock me-1" />Время
                                </span>
                                <span className={styles.summaryValue}>{timeLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <hr />

                <form onSubmit={handleSubmit}>
                    <ClientForm
                        name={clientName}
                        phone={clientPhone}
                        comment={comment}
                        onNameChange={setClientName}
                        onPhoneChange={setClientPhone}
                        onCommentChange={setComment}
                        isAway={isAway}
                        address={clientAddress}
                        onAddressChange={setClientAddress}
                        showAwayFields={false}
                    />

                    <button type="submit" className="btn btn-pink w-100" disabled={saving}>
                        {saving
                            ? 'Отправка...'
                            : (isAway ? 'Оформить предварительную запись' : 'Записаться')}
                    </button>
                </form>
            </div>
        </div>
    );
}