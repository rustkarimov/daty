import React, { useState, useEffect, useRef } from 'react';
import {
    loadMasterCategories,
    loadAvailableDates,
    createMultipleBookings,
} from '../../api/booking';
import { phoneMask } from '../../utils/phoneMask';
import shared from './BookingModalShared.module.css';
import useModal from '../../hooks/useModal';

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

export default function AddBookingModal({
    masterSlug,
    defaultDate,
    onClose,
    onCreated,
    allowCreateAnother = true,   // ← новый проп
}) {
    const [categories, setCategories] = useState([]);
    const [uncategorized, setUncategorized] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
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

    // ← Новое: результат созданной записи
    const [createdBooking, setCreatedBooking] = useState(null);

    const { showAlert } = useModal();
    const slotsRef = useRef(null);
    const summaryRef = useRef(null);

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

        fetch(`/api/${masterSlug}/slots/?total_duration=${totalDuration}&date=${selectedDate}`)
            .then(r => r.json())
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

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    function toggleService(service) {
        const exists = selectedServices.find(s => s.id === service.id);
        if (exists) {
            const newList = selectedServices.filter(s => s.id !== service.id);
            setSelectedServices(newList);
            setSelectedDate(defaultDate || '');
            setSelectedTime('');
        } else {
            if (selectedServices.length >= 3) {
                showAlert('Можно выбрать не более 3 услуг', 'warning');
                return;
            }
            const newList = [...selectedServices, service];
            setSelectedServices(newList);
            setSelectedDate(defaultDate || '');
            setSelectedTime('');
        }
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

    function isSelected(serviceId) {
        return selectedServices.some(s => s.id === serviceId);
    }

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    async function handleSave() {
        if (selectedServices.length === 0) {
            showAlert('Выберите хотя бы одну услугу', 'warning');
            return;
        }
        if (!selectedDate) {
            showAlert('Выберите дату', 'warning');
            return;
        }
        if (!selectedTime) {
            showAlert('Выберите время', 'warning');
            return;
        }
        if (!clientName.trim()) {
            showAlert('Введите имя клиента', 'warning');
            return;
        }
        const phoneCleaned = clientPhone.replace(/\D/g, '');
        if (phoneCleaned.length !== 11) {
            showAlert('Телефон должен содержать 11 цифр', 'warning');
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
                // ← Было: onCreated(); onClose();
                // ← Стало: показываем экран успеха
                setCreatedBooking({
                    clientName: clientName.trim(),
                    date: selectedDate,
                    time: selectedTime,
                    services: selectedServices.map(s => ({
                        name: s.name,
                        category: s.category_name || null,
                    })),
                    totalDuration,
                    totalPrice,
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

    // ← Новое: «Записать ещё»
    function handleCreateAnother() {
        setCreatedBooking(null);
        setSelectedServices([]);
        setSelectedDate(defaultDate || '');
        setSelectedTime('');
        setClientName('');
        setClientPhone('');
        setComment('');

        // Прокрутить наверх через 100мс, чтобы React успел отрисовать форму
        setTimeout(() => {
            const body = document.querySelector(`.${shared.body}`);
            if (body) body.scrollTop = 0;
        }, 100);
    }

    // ← Новое: «Готово»
    function handleFinish() {
        if (onCreated) onCreated();
        onClose();
    }

    function renderServiceCard(s, categoryName) {
        const selected = isSelected(s.id);
        return (
            <div
                key={s.id}
                className={`${shared.serviceCard} ${selected ? shared.serviceCardSelected : ''}`}
                onClick={() => toggleService({ ...s, category_name: categoryName })}
            >
                {selected && (
                    <button
                        type="button"
                        className={shared.serviceCloseBtn}
                        onClick={e => {
                            e.stopPropagation();
                            toggleService({ ...s, category_name: categoryName });
                        }}
                        aria-label="Убрать услугу"
                    >
                        ✕
                    </button>
                )}
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
                        <i className="fas fa-plus" style={{ color: 'var(--primary)' }} />
                        Добавить запись
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

                <div className={shared.body}>
                    {/* ← Новое: если запись создана — показываем экран успеха */}
                    {createdBooking ? (
                        <div className={shared.successBox}>
                            <div className={shared.successIcon}>
                                <i className="fas fa-check-circle" />
                            </div>
                            <h4 className={shared.successTitle}>Запись создана!</h4>
                            <div className={shared.successDetails}>
                                <p>
                                    <strong>{createdBooking.clientName}</strong> записан(а) на{' '}
                                    <strong>{formatDate(createdBooking.date)}</strong> в{' '}
                                    <strong>{createdBooking.time}</strong>
                                </p>
                                <p className={shared.successServices}>
                                    {createdBooking.services.map((s, i) => (
                                        <span key={i}>
                                            {s.category && (
                                                <span className={shared.successCategory}>{s.category}: </span>
                                            )}
                                            {s.name}
                                            {i < createdBooking.services.length - 1 && ', '}
                                        </span>
                                    ))}
                                </p>
                                <p className={shared.successMeta}>
                                    {createdBooking.totalDuration} мин · {createdBooking.totalPrice} ₽
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {loading ? (
                                <div className={shared.loading}>
                                    <div className="spinner-border" style={{ color: '#4053d3' }} />
                                </div>
                            ) : (
                                <>
                                    {/* Шаг 1: Услуги */}
                                    <label className={shared.sectionLabel}>
                                        Шаг 1: Выберите услуги (до 3)
                                    </label>

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

                                    {/* Шаг 2: Дата и время */}
                                    {selectedServices.length > 0 && (
                                        <>
                                            <label className={`${shared.sectionLabel} ${shared.sectionLabelTop}`}>
                                                Шаг 2: Дата и время
                                            </label>

                                            {loadingDates ? (
                                                <div className={shared.loading}>
                                                    <div className="spinner-border spinner-border-sm" style={{ color: '#4053d3' }} />
                                                </div>
                                            ) : (
                                                <div className={shared.dateGrid}>
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

                                    {/* Шаг 3: Сводка и данные клиента */}
                                    {selectedTime && (
                                        <>
                                            <div className={shared.summaryBox} ref={summaryRef}>
                                                <div className={shared.summaryTitle}>
                                                    <i className="fas fa-list" />
                                                    Выбранные услуги
                                                </div>

                                                {selectedServices.map(s => (
                                                    <div key={s.id} className={shared.summaryRow}>
                                                        <span>{s.name}</span>
                                                        <span className={shared.summaryRowMeta}>
                                                            {s.duration} мин · {s.price} ₽
                                                        </span>
                                                    </div>
                                                ))}

                                                <div className={shared.summaryTotal}>
                                                    <span>Итого</span>
                                                    <span className={shared.summaryTotalValue}>
                                                        {totalDuration} мин · {totalPrice} ₽
                                                    </span>
                                                </div>

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

                                            <label className={shared.sectionLabel}>Шаг 3: Данные клиента</label>
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
                        </>
                    )}
                </div>

                <div className={shared.footer}>
                    {createdBooking ? (
                        // ← Экран успеха: две кнопки
                        <>
                            {allowCreateAnother && (
                                <button
                                    type="button"
                                    className={shared.btnSecondary}
                                    onClick={handleCreateAnother}
                                >
                                    Записать ещё
                                </button>
                            )}
                            <button
                                type="button"
                                className={shared.btnPink}
                                onClick={handleFinish}
                            >
                                Готово
                            </button>
                        </>
                    ) : (
                        // ← Обычные кнопки
                        <>
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
                                disabled={saving || selectedServices.length === 0 || !selectedTime || !clientName}
                            >
                                {saving ? 'Сохранение...' : 'Создать запись'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}