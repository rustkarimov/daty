import React, { useState } from 'react';
import { createBookings } from '../../api/publicBooking';
import { phoneMask } from '../../utils/phoneMask';
import useModal from '../../hooks/useModal';
import styles from './ClientFormStep.module.css';

const MONTH_NAMES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dObj = new Date(y, m - 1, d);
    return `${dObj.getDate()} ${MONTH_NAMES[dObj.getMonth()]}`;
}

export default function ClientFormStep({
    identifier,
    selectedServices,
    selectedDate,
    selectedTime,
    isAway,
    onSuccess,
}) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);
    const { showAlert } = useModal();

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    async function handleSubmit(e) {
        e.preventDefault();
        const phoneCleaned = phone.replace(/\D/g, '');
        if (!name.trim()) {
            showAlert('Введите имя', 'warning');
            return;
        }
        if (phoneCleaned.length !== 11) {
            showAlert('Телефон должен содержать 11 цифр', 'warning');
            return;
        }
        if (isAway && !address.trim()) {
            showAlert('Укажите адрес для выезда', 'warning');
            return;
        }

        setSaving(true);
        try {
            const data = await createBookings(identifier, {
                services: selectedServices.map(s => s.id),
                client_name: name.trim(),
                client_phone: phoneCleaned,
                date: selectedDate,
                start_time: selectedTime,
                client_address: isAway ? address.trim() : '',
                comment: comment.trim(),
                created_by: 'client',
            });

            if (data.success && data.data) {
                onSuccess({
                    message: data.data.message,
                    status: data.data.status,
                    is_away: data.data.is_away,
                    bookings: data.data.bookings || [],
                    clientAddress: isAway ? address.trim() : '',
                });
            } else {
                showAlert(data.error || 'Ошибка создания записи', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="card mb-4">
            <div className="card-header bg-white">
                <h5 className="mb-0">
                    <i className="fas fa-pencil-alt me-2" style={{ color: 'var(--primary)' }} />
                    Шаг 4: Ваши данные
                </h5>
            </div>
            <div className="card-body">
                {/* Сводка */}
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
                                <span className={styles.summaryValue}>{selectedTime}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <hr />

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Ваше имя</label>
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Телефон</label>
                        <input
                            type="tel"
                            className="form-control"
                            placeholder="7 999 123-45-67"
                            value={phone}
                            onChange={e => setPhone(phoneMask(e.target.value))}
                            required
                        />
                        <small className="text-muted">Номер будет виден только мастеру</small>
                    </div>

                    {isAway && (
                        <div className="mb-3">
                            <label className="form-label">Адрес для выезда</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="г. Москва, ул. Ленина, 5, кв. 10"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                required
                            />
                            <small className="text-muted">Мастер приедет по этому адресу</small>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label">Комментарий (необязательно)</label>
                        <textarea
                            className="form-control"
                            rows="2"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-pink w-100" disabled={saving}>
                        {saving ? 'Отправка...' : (isAway ? 'Оформить предварительную запись' : 'Записаться')}
                    </button>
                </form>
            </div>
        </div>
    );
}