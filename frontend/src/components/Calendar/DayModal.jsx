import React, { useState, useEffect } from 'react';
import BreaksEditor from './BreaksEditor';
import EditBookingModal from './EditBookingModal';
import AddBookingModal from './AddBookingModal';
import {
    loadDayStatus,
    loadBookingsByDate,
    makeDayOff,
    makeDayWorking,
    deleteBooking,
} from '../../api/day';



const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const WEEKDAY_NAMES = [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота'
];

export default function DayModal({ dateStr, masterSlug, onClose, onDataChanged }) {
    const [dayData, setDayData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [breaks, setBreaks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [showAddBooking, setShowAddBooking] = useState(false);
    const [editingHours, setEditingHours] = useState(false);
    const [editHours, setEditHours] = useState({ start: '', end: '' });

    const dateObj = new Date(dateStr);
    const dateTitle = `${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]} (${WEEKDAY_NAMES[dateObj.getDay()]})`;

    useEffect(() => {
        setLoading(true);
        Promise.all([loadDayStatus(dateStr), loadBookingsByDate(dateStr)])
            .then(([status, bookingsData]) => {
                setDayData(status);
                setBookings(bookingsData.bookings || []);
                setBreaks(status.breaks || []);
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

    async function saveBreaks(newBreaks) {
        const workStart = dayData?.extra_start || dayData?.schedule_start || '09:00';
        const workEnd = dayData?.extra_end || dayData?.schedule_end || '18:00';

        try {
            const r = await fetch('/api/extra-days/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    date: dateStr,
                    start_time: workStart,
                    end_time: workEnd,
                    breaks: newBreaks.filter(b => b.start && b.end),
                }),
            });
            const data = await r.json();
            if (!data.success) {
                alert(data.error || 'Ошибка сохранения');
            } else {
                setBreaks(newBreaks.filter(b => b.start && b.end));
                if (onDataChanged) onDataChanged();
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения');
        }
    }

    async function handleDeleteBooking(bookingId, clientName, time) {
        if (!confirm(`Удалить запись клиента "${clientName}" на ${time}?`)) return;

        try {
            const data = await deleteBooking(bookingId);
            if (data.success) {
                const bookingsData = await loadBookingsByDate(dateStr);
                setBookings(bookingsData.bookings || []);
                if (onDataChanged) onDataChanged();
            } else {
                alert(data.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения');
        }
    }

    function handleEditBooking(bookingId) {
        setEditingBookingId(bookingId);
    }

    function handleCloseEditModal() {
        setEditingBookingId(null);
    }

    async function handleSavedEdit() {
        try {
            const bookingsData = await loadBookingsByDate(dateStr);
            setBookings(bookingsData.bookings || []);
            if (onDataChanged) onDataChanged();
        } catch (error) {
            console.error('Ошибка перезагрузки записей:', error);
        }
    }

    function handleOpenAddBooking() {
        setShowAddBooking(true);
    }

    function handleCloseAddBooking() {
        setShowAddBooking(false);
    }

    async function handleBookingCreated() {
        try {
            const bookingsData = await loadBookingsByDate(dateStr);
            setBookings(bookingsData.bookings || []);
            if (onDataChanged) onDataChanged();
        } catch (error) {
            console.error('Ошибка перезагрузки записей:', error);
        }
    }

    function startEditingHours() {
        const start = dayData?.extra_start || dayData?.schedule_start || '09:00';
        const end = dayData?.extra_end || dayData?.schedule_end || '18:00';
        setEditHours({ start, end });
        setEditingHours(true);
    }

    function cancelEditingHours() {
        setEditingHours(false);
    }

    async function saveHours() {
        if (!editHours.start || !editHours.end) {
            alert('Заполните начало и конец работы');
            return;
        }
        if (editHours.start >= editHours.end) {
            alert('Начало не может быть позже окончания');
            return;
        }

        try {
            const r = await fetch('/api/extra-days/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    date: dateStr,
                    start_time: editHours.start,
                    end_time: editHours.end,
                    breaks: breaks.filter(b => b.start && b.end),
                }),
            });
            const data = await r.json();
            if (!data.success) {
                alert(data.error || 'Ошибка сохранения');
            } else {
                setEditingHours(false);
                // Перезагружаем данные дня, чтобы обновить часы и перерывы
                const status = await loadDayStatus(dateStr);
                setDayData(status);
                setBreaks(status.breaks || []);
                if (onDataChanged) onDataChanged();
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения');
        }
    }

    const isDayOff = dayData?.is_day_off || !(dayData?.has_schedule || dayData?.is_extra);

    return (
        <>
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
                                        ) : editingHours ? (
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <i className="fas fa-clock" style={{ color: 'var(--primary)' }} />
                                                <input
                                                    type="time"
                                                    className="form-control form-control-sm"
                                                    style={{ width: '110px' }}
                                                    value={editHours.start}
                                                    onChange={e => setEditHours({ ...editHours, start: e.target.value })}
                                                />
                                                <span>—</span>
                                                <input
                                                    type="time"
                                                    className="form-control form-control-sm"
                                                    style={{ width: '110px' }}
                                                    value={editHours.end}
                                                    onChange={e => setEditHours({ ...editHours, end: e.target.value })}
                                                />
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={saveHours}
                                                    title="Сохранить"
                                                >
                                                    <i className="fas fa-check" />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={cancelEditingHours}
                                                    title="Отмена"
                                                >
                                                    <i className="fas fa-times" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="fas fa-clock" style={{ color: 'var(--primary)' }} />
                                                <strong>Работаю:</strong>{' '}
                                                {dayData?.extra_start || dayData?.schedule_start} -{' '}
                                                {dayData?.extra_end || dayData?.schedule_end}
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={startEditingHours}
                                                    title="Изменить часы работы"
                                                >
                                                    <i className="fas fa-edit" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Перерывы */}
                                    {!isDayOff && (
                                        <div className="mb-3">
                                            <BreaksEditor breaks={breaks} onChange={saveBreaks} />
                                        </div>
                                    )}

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
                                        <button className="btn btn-pink" onClick={handleOpenAddBooking}>
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
                                                        <th>Действия</th>
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
                                                            <td className="action-icons">
                                                                <button
                                                                    className="btn btn-sm"
                                                                    onClick={() => handleEditBooking(b.id)}
                                                                    title="Редактировать"
                                                                >
                                                                    <i className="fas fa-edit" />
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    onClick={() => handleDeleteBooking(b.id, b.client_name, b.time)}
                                                                    title="Удалить"
                                                                >
                                                                    <i className="fas fa-trash" />
                                                                </button>
                                                            </td>
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

            {/* Модалка редактирования записи — вынесена за пределы #dayModal */}
            {editingBookingId && (
                <EditBookingModal
                    bookingId={editingBookingId}
                    masterSlug={masterSlug}
                    onClose={handleCloseEditModal}
                    onSaved={handleSavedEdit}
                />
            )}

            {showAddBooking && (
                <AddBookingModal
                    masterSlug={masterSlug}
                    defaultDate={dateStr}
                    onClose={handleCloseAddBooking}
                    onCreated={handleBookingCreated}
                />
            )}
        </>
    );
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}