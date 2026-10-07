import React, { useState, useEffect, useRef } from 'react';
import {
    loadMasterCategories,
    loadAvailableDates,
} from '../../api/booking';
import { loadBookingForEdit, updateBooking } from '../../api/day';
import { phoneMask } from '../../utils/phoneMask';
import shared from './BookingModalShared.module.css';

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];
const WEEKDAY_NAMES = [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота'
];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dObj = new Date(y, m - 1, d);
    return `${dObj.getDate()} ${MONTH_NAMES[dObj.getMonth()]} (${WEEKDAY_NAMES[dObj.getDay()]})`;
}

export default function EditBookingModal({ bookingId, masterSlug, onClose, onSaved }) {
    const [form, setForm] = useState(null);
    const [categories, setCategories] = useState([]);
    const [uncategorized, setUncategorized] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
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
    const slotsRef = useRef(null);
    const summaryRef = useRef(null);
    const datesRef = useRef(null);
    const bodyRef = useRef(null);
    const shouldScrollToDates = useRef(false);

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

    useEffect(() => {
        if (!form || categories.length === 0) return;
        if (selectedService) return;

        const allServices = [
            ...categories.flatMap(c => c.services.map(s => ({ ...s, category_name: c.name }))),
            ...uncategorized.map(s => ({ ...s, category_name: null })),
        ];
        const found = allServices.find(s => s.id === form.service_id);
        if (found) setSelectedService(found);
    }, [form, categories, uncategorized, selectedService]);

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

    // Скролл к датам после их отрисовки
    useEffect(() => {
        if (!shouldScrollToDates.current) return;
        if (loadingDates) return;
        if (availableDates.length === 0) return;
        if (!datesRef.current || !bodyRef.current) return;

        shouldScrollToDates.current = false;

        const bodyEl = bodyRef.current;
        const datesEl = datesRef.current;
        const targetTop = datesEl.offsetTop - bodyEl.offsetTop - 8;

        bodyEl.scrollTo({ top: targetTop, behavior: 'smooth' });
    }, [availableDates, loadingDates]);

    useEffect(() => {
        if (!selectedService || !selectedDate) return;

        setLoadingSlots(true);
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
        setSelectedDate('');
        setSelectedTime('');
        shouldScrollToDates.current = true;
    }

    function handleDateClick(date) {
        setSelectedDate(date);
        setSelectedTime('');
        setTimeout(() => {
            if (slotsRef.current) {
                slotsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    function handleTimeClick(time) {
        setSelectedTime(time);
        setTimeout(() => {
            if (summaryRef.current) {
                summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
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

    function renderServiceCard(s, categoryName) {
        const selected = isServiceSelected(s.id);
        return (
            <div
                key={s.id}
                className={`${shared.serviceCard} ${selected ? shared.serviceCardSelected : ''}`}
                onClick={() => selectService({ ...s, category_name: categoryName })}
            >
                <div className={shared.serviceCardHeader}>
                    <div className={shared.serviceCardName}>{s.name}</div>
                    <span className={shared.serviceCardPrice}>{s.price} ₽</span>
                </div>
                <div className={shared.serviceCardMeta}>
                    <i className="far fa-clock me-1" />
                    {s.duration} мин
                </div>
            </div>
        );
    }

    return (
        <div className={shared.backdrop} onClick={handleBackdropClick}>
            <div className={shared.modal} onClick={e => e.stopPropagation()}>
                <div className={shared.header}>
                    <h5 className={shared.title}>
                        <i className="fas fa-edit" style={{ color: 'var(--primary)' }} />
                        Редактирование записи
                    </h5>
                    <button
                        type="button"
                        className={shared.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className={shared.body} ref={bodyRef}>
                    {loading ? (
                        <div className={shared.loading}>
                            <div className="spinner-border" style={{ color: '#4053d3' }} />
                        </div>
                    ) : !form ? (
                        <p className="text-danger">Не удалось загрузить данные</p>
                    ) : (
                        <>
                            <label className={shared.sectionLabel}>Услуга</label>

                            {categories.map(cat => (
                                <div key={cat.id} style={{ marginBottom: '12px' }}>
                                    <div className={shared.categoryLabel}>{cat.name}</div>
                                    <div className={shared.grid}>
                                        {cat.services.map(s => renderServiceCard(s, cat.name))}
                                    </div>
                                </div>
                            ))}

                            {uncategorized.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                    <div className={shared.categoryLabel}>Без категории</div>
                                    <div className={shared.grid}>
                                        {uncategorized.map(s => renderServiceCard(s, null))}
                                    </div>
                                </div>
                            )}

                            {selectedService && (
                                <>
                                    <label className={`${shared.sectionLabel} ${shared.sectionLabelTop}`}>
                                        Дата и время
                                    </label>

                                    {loadingDates ? (
                                        <div className={shared.loading}>
                                            <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
                                        </div>
                                    ) : (
                                        <div className={shared.dateGrid} ref={datesRef}>
                                            {availableDates.map(d => (
                                                <div
                                                    key={d.date}
                                                    className={`${shared.dateCard} ${selectedDate === d.date ? shared.dateCardSelected : ''}`}
                                                    onClick={() => handleDateClick(d.date)}
                                                >
                                                    <div className={shared.dateCardWeekday}>{d.day_of_week}</div>
                                                    <div className={shared.dateCardDay}>{d.display}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedDate && (
                                        <div ref={slotsRef}>
                                            {loadingSlots ? (
                                                <div className={shared.loading}>
                                                    <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
                                                </div>
                                            ) : availableSlots.length === 0 ? (
                                                <p className={shared.emptyText}>Нет свободных слотов</p>
                                            ) : (
                                                <div className={shared.slotGrid}>
                                                    {availableSlots.map(slot => (
                                                        <div
                                                            key={slot.start}
                                                            className={`${shared.slotCard} ${selectedTime === slot.start ? shared.slotCardSelected : ''}`}
                                                            onClick={() => handleTimeClick(slot.start)}
                                                        >
                                                            {slot.start}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedTime && (
                                <>
                                    <div className={shared.summaryBox} ref={summaryRef}>
                                        <div className={shared.summaryTitle}>
                                            <i className="fas fa-list" />
                                            Услуга
                                        </div>
                                        {selectedService && (
                                            <div className={shared.summaryRow}>
                                                <span>{selectedService.name}</span>
                                                <span className={shared.summaryRowMeta}>
                                                    {selectedService.duration} мин · {selectedService.price} ₽
                                                </span>
                                            </div>
                                        )}
                                        <div className={shared.summaryMeta}>
                                            <span className={shared.summaryMetaItem}>
                                                <i className="far fa-calendar-alt" />
                                                {formatDate(selectedDate)}
                                            </span>
                                            <span className={shared.summaryMetaItem}>
                                                <i className="far fa-clock" />
                                                {selectedTime}
                                            </span>
                                        </div>
                                    </div>

                                    <label className={shared.sectionLabel}>Данные клиента</label>
                                    <input
                                        type="text"
                                        className={shared.formInput}
                                        placeholder="Имя клиента"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                    />
                                    <input
                                        type="tel"
                                        className={shared.formInput}
                                        placeholder="7 999 123-45-67"
                                        value={clientPhone}
                                        onChange={e => setClientPhone(phoneMask(e.target.value))}
                                    />
                                    <textarea
                                        className={shared.formTextarea}
                                        rows="2"
                                        placeholder="Комментарий (необязательно)"
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                    />
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className={shared.footer}>
                    <button
                        type="button"
                        className={shared.btnSecondary}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        className={shared.btnPink}
                        onClick={handleSave}
                        disabled={saving || !selectedService || !selectedTime || !clientName}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}