import React, { useState, useEffect } from 'react';
import {
    loadMasterCategories,
    loadAvailableDates,
    loadAvailableSlots,
    createMultipleBookings,
} from '../../api/booking';

import { phoneMask } from '../../utils/phoneMask';

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export default function AddBookingModal({ masterSlug, defaultDate, onClose, onCreated }) {
    const [categories, setCategories] = useState([]);
    const [uncategorized, setUncategorized] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]); // [{id, name, duration, price}]
    const [availableDates, setAvailableDates] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(defaultDate || '');
    const [selectedTime, setSelectedTime] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingDates, setLoadingDates] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving] = useState(false);

    // Загрузка услуг
    useEffect(() => {
        loadMasterCategories(masterSlug)
            .then(data => {
                setCategories(data.categories || []);
                setUncategorized(data.uncategorized || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки услуг:', error);
                setLoading(false);
            });
    }, [masterSlug]);

    // Загрузка дат при изменении выбранных услуг
    useEffect(() => {
        if (selectedServices.length === 0) {
            setAvailableDates([]);
            setAvailableSlots([]);
            return;
        }

        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
        setLoadingDates(true);
        loadAvailableDates(masterSlug, totalDuration)
            .then(data => {
                setAvailableDates(data.dates || []);
                setLoadingDates(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки дат:', error);
                setLoadingDates(false);
            });
    }, [selectedServices, masterSlug]);

    // Загрузка слотов при изменении даты
    useEffect(() => {
        if (selectedServices.length === 0 || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
        setLoadingSlots(true);
        loadAvailableSlots(masterSlug, totalDuration, selectedDate)
            .then(data => {
                setAvailableSlots(data.slots || []);
                setLoadingSlots(false);
                setSelectedTime('');
            })
            .catch(error => {
                console.error('Ошибка загрузки слотов:', error);
                setLoadingSlots(false);
            });
    }, [selectedDate, selectedServices, masterSlug]);

    function toggleService(service) {
        const exists = selectedServices.find(s => s.id === service.id);
        if (exists) {
            setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        } else {
            if (selectedServices.length >= 3) {
                alert('Можно выбрать не более 3 услуг');
                return;
            }
            setSelectedServices([...selectedServices, service]);
        }
    }

    function isSelected(serviceId) {
        return selectedServices.some(s => s.id === serviceId);
    }

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    async function handleSave() {
        if (selectedServices.length === 0) {
            alert('Выберите хотя бы одну услугу');
            return;
        }
        if (!selectedDate) {
            alert('Выберите дату');
            return;
        }
        if (!selectedTime) {
            alert('Выберите время');
            return;
        }
        if (!clientName.trim()) {
            alert('Введите имя клиента');
            return;
        }
        const phoneCleaned = clientPhone.replace(/\D/g, '');
        if (phoneCleaned.length !== 11) {
            alert('Телефон должен содержать 11 цифр');
            return;
        }

        setSaving(true);
        try {
            const data = await createMultipleBookings(masterSlug, {
                services: selectedServices.map(s => s.id),
                client_name: clientName.trim(),
                client_phone: phoneCleaned,
                date: selectedDate,
                start_time: selectedTime,
                comment: comment.trim(),
                created_by: 'master',
            });
            if (data.success) {
                if (onCreated) onCreated();
                onClose();
            } else {
                alert(data.error || 'Ошибка создания записи');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="modal fade show"
            style={{
                display: 'block',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 1080,
                overflowY: 'auto',
            }}
            onClick={handleBackdropClick}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-plus me-2" style={{ color: 'var(--primary)' }} />
                            Добавить запись
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-3">
                                <div className="spinner-border" style={{ color: '#4053d3' }} />
                            </div>
                        ) : (
                            <>
                                {/* Шаг 1: Услуги */}
                                <label className="form-label mb-2" style={{ fontWeight: 600 }}>
                                    Шаг 1: Выберите услуги (до 3)
                                </label>

                                {categories.map(cat => (
                                    <div key={cat.id} className="mb-3">
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            {cat.name}
                                        </div>
                                        <div className="row g-2">
                                            {cat.services.map(s => (
                                                <div key={s.id} className="col-md-6">
                                                    <div
                                                        className={`public-service-card ${isSelected(s.id) ? 'selected border-pink' : ''}`}
                                                        onClick={() => toggleService(s)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="fw-bold" style={{ fontSize: '0.85rem' }}>
                                                                {s.name}
                                                            </div>
                                                            <span className="fw-bold" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
                                                                {s.price} ₽
                                                            </span>
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                                                            <i className="far fa-clock me-1" />
                                                            {s.duration} мин
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {uncategorized.length > 0 && (
                                    <div className="mb-3">
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            Без категории
                                        </div>
                                        <div className="row g-2">
                                            {uncategorized.map(s => (
                                                <div key={s.id} className="col-md-6">
                                                    <div
                                                        className={`public-service-card ${isSelected(s.id) ? 'selected border-pink' : ''}`}
                                                        onClick={() => toggleService(s)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{s.name}</div>
                                                            <span className="fw-bold" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
                                                                {s.price} ₽
                                                            </span>
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                                                            <i className="far fa-clock me-1" />
                                                            {s.duration} мин
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                
                                {/* Шаг 2: Дата и время */}
                                {selectedServices.length > 0 && (
                                    <>
                                        <label className="form-label mb-2 mt-3" style={{ fontWeight: 600 }}>
                                            Шаг 2: Дата и время
                                        </label>

                                        {loadingDates ? (
                                            <div className="text-center py-2">
                                                <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
                                            </div>
                                        ) : (
                                            <div className="row g-2 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {availableDates.map(d => (
                                                    <div key={d.date} className="col-4 col-md-3">
                                                        <div
                                                            className={`date-card text-center ${selectedDate === d.date ? 'border-pink' : ''}`}
                                                            onClick={() => setSelectedDate(d.date)}
                                                            style={{ cursor: 'pointer', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                                        >
                                                            <div className="small text-muted" style={{ fontSize: '0.65rem' }}>
                                                                {d.day_of_week}
                                                            </div>
                                                            <div className="fw-bold" style={{ fontSize: '0.8rem' }}>
                                                                {d.display}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {selectedDate && (
                                            <>
                                                {loadingSlots ? (
                                                    <div className="text-center py-2">
                                                        <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
                                                    </div>
                                                ) : (
                                                    <div className="row g-2 mb-3">
                                                        {availableSlots.length === 0 ? (
                                                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                                Нет свободных слотов
                                                            </p>
                                                        ) : (
                                                            availableSlots.map(slot => (
                                                                <div key={slot.start} className="col-3 col-md-2">
                                                                    <div
                                                                        className={`slot-card text-center ${selectedTime === slot.start ? 'border-pink' : ''}`}
                                                                        onClick={() => setSelectedTime(slot.start)}
                                                                        style={{ cursor: 'pointer', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.8rem' }}
                                                                    >
                                                                        {slot.start}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Шаг 3: Сводка и данные клиента */}
                                {selectedTime && (
                                    <>
                                        {/* Сводка */}
                                        <div className="booking-summary mb-3" style={{
                                            background: '#f9fafb',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '8px' }}>
                                                <i className="fas fa-list me-1" />
                                                Выбранные услуги
                                            </div>

                                            {selectedServices.map((s, idx) => (
                                                <div key={s.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '6px 0',
                                                    borderBottom: idx < selectedServices.length - 1 ? '1px solid #f3f4f6' : 'none',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <span>{s.name}</span>
                                                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                                                        {s.duration} мин · {s.price} ₽
                                                    </span>
                                                </div>
                                            ))}

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                paddingTop: '10px',
                                                marginTop: '6px',
                                                borderTop: '2px solid #e5e7eb',
                                                fontWeight: 600,
                                                fontSize: '0.9rem'
                                            }}>
                                                <span>Итого</span>
                                                <span style={{ color: 'var(--primary)' }}>
                                                    {totalDuration} мин · {totalPrice} ₽
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: '#6b7280' }}>
                                                <span>
                                                    <i className="far fa-calendar-alt me-1" />
                                                    {selectedDate}
                                                </span>
                                                <span>
                                                    <i className="far fa-clock me-1" />
                                                    {selectedTime}
                                                </span>
                                            </div>
                                        </div>

                                        <label className="form-label mb-2" style={{ fontWeight: 600 }}>
                                            Шаг 3: Данные клиента
                                        </label>
                                        <div className="mb-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Имя клиента"
                                                value={clientName}
                                                onChange={e => setClientName(e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <input
                                                type="tel"
                                                className="form-control"
                                                placeholder="7 999 123-45-67"
                                                value={clientPhone}
                                                onChange={e => setClientPhone(phoneMask(e.target.value))}
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <textarea
                                                className="form-control"
                                                rows="2"
                                                placeholder="Комментарий (необязательно)"
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
                            Отмена
                        </button>
                        <button
                            className="btn btn-pink"
                            onClick={handleSave}
                            disabled={saving || selectedServices.length === 0 || !selectedTime || !clientName}
                        >
                            {saving ? 'Сохранение...' : 'Создать запись'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}