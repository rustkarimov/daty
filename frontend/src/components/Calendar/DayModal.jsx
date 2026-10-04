import React, { useState, useEffect } from 'react';
import { loadDayStatus, loadBookingsByDate, makeDayOff, makeDayWorking } from '../../api/day';

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const WEEKDAY_NAMES = [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота'
];

export default function DayModal({ dateStr, onClose, onDataChanged }) {
    const [dayData, setDayData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Парсим дату
    const dateObj = new Date(dateStr);
    const dateTitle = `${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]} (${WEEKDAY_NAMES[dateObj.getDay()]})`;

    useEffect(() => {
        setLoading(true);
        Promise.all([loadDayStatus(dateStr), loadBookingsByDate(dateStr)])
            .then(([status, bookingsData]) => {
                setDayData(status);
                setBookings(bookingsData.bookings || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки дня:', error);
                setLoading(false);
            });
    }, [dateStr]);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleMakeDayOff() {
        if (!confirm('Сделать этот день выходным?')) return;
        makeDayOff(dateStr)
            .then(data => {
                if (data.success) {
                    if (onDataChanged) onDataChanged();
                    onClose();
                } else {
                    alert(data.error || 'Ошибка');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Ошибка соединения');
            });
    }

    function handleMakeDayWorking() {
        if (!confirm('Сделать этот день рабочим? Будут установлены часы 09:00-18:00.')) return;
        makeDayWorking(dateStr)
            .then(data => {
                if (data.success) {
                    if (onDataChanged) onDataChanged();
                    onClose();
                } else {
                    alert(data.error || 'Ошибка');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Ошибка соединения');
            });
    }

    const isDayOff = dayData?.is_day_off || !(dayData?.has_schedule || dayData?.is_extra);

    return (
        <div
            id="dayModal"
            className="modal fade show"
            style={{
                display: 'block',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={handleBackdropClick}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="far fa-calendar-alt me-2" style={{ color: 'var(--primary)' }} />
                            {dateTitle}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        />
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-3">
                                <div className="spinner-border" style={{ color: '#4053d3' }} />
                            </div>
                        ) : (
                            <>
                                {/* Инфо о дне */}
                                <div className="mb-3">
                                    {isDayOff ? (
                                        <div className="text-muted">
                                            <i className="fas fa-bed me-2" />
                                            Выходной день
                                        </div>
                                    ) : (
                                        <div>
                                            <i className="fas fa-clock me-2" style={{ color: 'var(--primary)' }} />
                                            <strong>Работаю:</strong>{' '}
                                            {dayData?.extra_start || dayData?.schedule_start} -{' '}
                                            {dayData?.extra_end || dayData?.schedule_end}
                                        </div>
                                    )}
                                </div>

                                {/* Кнопки управления */}
                                <div className="d-flex gap-2 mb-3 flex-wrap">
                                    {isDayOff ? (
                                        <button
                                            className="btn btn-outline-success"
                                            onClick={handleMakeDayWorking}
                                        >
                                            <i className="fas fa-calendar-check me-2" />
                                            Сделать рабочим днём
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-outline-soft-blue"
                                            onClick={handleMakeDayOff}
                                        >
                                            <i className="fas fa-calendar-times me-2" />
                                            Сделать выходным
                                        </button>
                                    )}
                                    <button className="btn btn-pink">
                                        Добавить запись
                                    </button>
                                </div>

                                <hr />

                                {/* Записи */}
                                <h6 className="mb-3">
                                    <i className="fas fa-list me-2" />
                                    Записи на этот день ({bookings.length})
                                </h6>
                                {bookings.length === 0 ? (
                                    <p className="text-muted text-center mb-0">Нет записей</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Время</th>
                                                    <th>Клиент</th>
                                                    <th>Услуга</th>
                                                    <th>Телефон</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookings.map(b => (
                                                    <tr key={b.id}>
                                                        <td>{b.time}</td>
                                                        <td>{b.client_name}</td>
                                                        <td>
                                                            {b.category_name ? `${b.category_name}. ` : ''}
                                                            {b.service_name}
                                                        </td>
                                                        <td>{b.phone || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}