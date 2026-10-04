import React, { useState, useEffect } from 'react';
import {
    loadMasterCategories,
    loadAvailableDates,
    loadAvailableSlots,
} from '../../api/booking';
import { loadBookingForEdit, updateBooking } from '../../api/day';
import { phoneMask } from '../../utils/phoneMask';

export default function EditBookingModal({ bookingId, masterSlug, onClose, onSaved }) {
    const [form, setForm] = useState(null);
    const [categories, setCategories] = useState([]);
    const [uncategorized, setUncategorized] = useState([]);
    const [selectedService, setSelectedService] = useState(null); // {id, name, duration, price}
    const [availableDates, setAvailableDates] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingDates, setLoadingDates] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving] = useState(false);

    // Загрузка данных записи
    useEffect(() => {
        setLoading(true);
        loadBookingForEdit(bookingId)
            .then(data => {
                setForm(data);
                setSelectedDate(data.date);
                setSelectedTime(data.time);
                setClientName(data.client_name || '');
                setClientPhone(data.client_phone ? phoneMask(data.client_phone) : '');
                setComment(data.comment || '');
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки записи:', error);
                setLoading(false);
            });
    }, [bookingId]);

    // Загрузка списка услуг
    useEffect(() => {
        loadMasterCategories(masterSlug)
            .then(data => {
                setCategories(data.categories || []);
                setUncategorized(data.uncategorized || []);
            })
            .catch(error => {
                console.error('Ошибка загрузки услуг:', error);
            });
    }, [masterSlug]);

    // Устанавливаем выбранную услугу, когда загружены и запись, и услуги
    useEffect(() => {
        if (!form || categories.length === 0) return;
        if (selectedService) return; // уже выбрана

        const allServices = [
            ...categories.flatMap(c => c.services.map(s => ({ ...s, category_name: c.name }))),
            ...uncategorized.map(s => ({ ...s, category_name: null })),
        ];
        const found = allServices.find(s => s.id === form.service_id);
        if (found) {
            setSelectedService(found);
        }
    }, [form, categories, uncategorized, selectedService]);

    // Загрузка дат при изменении услуги
    useEffect(() => {
        if (!selectedService) return;

        setLoadingDates(true);
        loadAvailableDates(masterSlug, selectedService.duration)
            .then(data => {
                setAvailableDates(data.dates || []);
                setLoadingDates(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки дат:', error);
                setLoadingDates(false);
            });
    }, [selectedService, masterSlug]);

    // Загрузка слотов при изменении даты
    useEffect(() => {
        if (!selectedService || !selectedDate) return;

        setLoadingSlots(true);
        // Для редактирования передаём exclude_booking_id, чтобы текущая запись не блокировала свой же слот
        fetch(`/api/${masterSlug}/slots/?total_duration=${selectedService.duration}&date=${selectedDate}&exclude_booking_id=${bookingId}&original_booking_id=${bookingId}`)
            .then(r => r.json())
            .then(data => {
                setAvailableSlots(data.slots || []);
                setLoadingSlots(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки слотов:', error);
                setLoadingSlots(false);
            });
    }, [selectedDate, selectedService, masterSlug, bookingId]);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function selectService(service) {
        setSelectedService(service);
    }

    function isServiceSelected(serviceId) {
        return selectedService?.id === serviceId;
    }

    async function handleSave() {
        if (!selectedService) {
            alert('Выберите услугу');
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
            const data = await updateBooking(bookingId, {
                service_id: selectedService.id,
                client_name: clientName.trim(),
                client_phone: phoneCleaned,
                date: selectedDate,
                time: selectedTime,
                comment: comment.trim(),
                status: form.status || 'confirmed',
            });
            if (data.success) {
                if (onSaved) onSaved();
                onClose();
            } else {
                alert(data.error || 'Ошибка сохранения');
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
                            <i className="fas fa-edit me-2" style={{ color: 'var(--primary)' }} />
                            Редактирование записи
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-3">
                                <div className="spinner-border" style={{ color: '#4053d3' }} />
                            </div>
                        ) : !form ? (
                            <p className="text-danger">Не удалось загрузить данные</p>
                        ) : (
                            <>
                                {/* Шаг 1: Услуга */}
                                <label className="form-label mb-2" style={{ fontWeight: 600 }}>
                                    Услуга
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
                                                        className={`public-service-card ${isServiceSelected(s.id) ? 'selected border-pink' : ''}`}
                                                        onClick={() => selectService({ ...s, category_name: cat.name })}
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
                                                        className={`public-service-card ${isServiceSelected(s.id) ? 'selected border-pink' : ''}`}
                                                        onClick={() => selectService({ ...s, category_name: null })}
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
                                {selectedService && (
                                    <>
                                        <label className="form-label mb-2 mt-3" style={{ fontWeight: 600 }}>
                                            Дата и время
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

                                {/* Шаг 3: Данные клиента */}
                                {selectedTime && (
                                    <>
                                        <div className="booking-summary mb-3" style={{
                                            background: '#f9fafb',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '8px' }}>
                                                <i className="fas fa-list me-1" />
                                                Услуга
                                            </div>
                                            {selectedService && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                    <span>{selectedService.name}</span>
                                                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                                                        {selectedService.duration} мин · {selectedService.price} ₽
                                                    </span>
                                                </div>
                                            )}
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
                                            Данные клиента
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
                            disabled={saving || !selectedService || !selectedTime || !clientName}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}