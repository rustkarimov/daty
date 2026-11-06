// frontend/src/components/Dashboard/Calendar/AddBookingModal.jsx
import React, { useState, useRef } from 'react';
import shared from './BookingModalShared.module.css';
import useModal from '../../../hooks/useModal';
import useBodyLock from '../../../hooks/useBodyLock';
import { formatDate } from '../../../utils/date';
import useBookingForm from './useBookingForm';
import ServiceCards from './ServiceCards';
import DateGrid from './DateGrid';
import SlotGrid from './SlotGrid';
import BookingSummary from './BookingSummary';
import ClientForm from './ClientForm';

export default function AddBookingModal({
    masterSlug,
    masterMode = 'home',
    defaultDate,
    defaultTime,
    onClose,
    onCreated,
    allowCreateAnother = true,
}) {
    useBodyLock();
    const { showAlert } = useModal();

    // ---- Успех-экран ----
    const [createdBooking, setCreatedBooking] = useState(null);

    // ---- Флаг: была ли создана хотя бы одна запись ----
    // Нужен, чтобы при закрытии через «Отмену»/крестик/backdrop
    // обновить дашборд, если записи уже создавались.
    const [createdAny, setCreatedAny] = useState(false);

    // ---- Рефы для скролла ----
    const slotsRef = useRef(null);
    const summaryRef = useRef(null);

    // ---- Вся логика формы — в хуке ----
    const form = useBookingForm({
        mode: 'add',
        masterSlug,
        masterMode,
        defaultDate,
        defaultTime,
        onSaved: null,   // обработаем сами, чтобы показать успех-экран
    });

    const {
        categories,
        uncategorized,
        loading,
        loadingDates,
        loadingSlots,
        saving,
        selectedServices,
        toggleService,
        totalDuration,
        totalPrice,
        availableDates,
        availableSlots,
        selectedDate,
        selectedTime,
        selectedSlotEnd,
        selectDate,
        selectTime,
        clientName,
        clientPhone,
        clientAddress,
        comment,
        setClientName,
        setClientPhone,
        setClientAddress,
        setComment,
        travelBefore,
        travelAfter,
        durationExtra,
        setTravelBefore,
        setTravelAfter,
        setDurationExtra,
        reset,
        save,
        isAway,
    } = form;

    // ---- Закрытие (крестик, «Отмена», backdrop) ----
    function handleClose() {
        if (createdAny && onCreated) {
            onCreated();
        }
        onClose();
    }

    // ---- Backdrop ----
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) handleClose();
    }

    // ---- Выбор даты (со скроллом к слотам) ----
    function handleDateClick(date) {
        selectDate(date);
        setTimeout(() => {
            if (slotsRef.current) {
                slotsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    // ---- Выбор времени (со скроллом к summary) ----
    function handleTimeClick(slot) {
        selectTime(slot);
        setTimeout(() => {
            if (summaryRef.current) {
                summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    // ---- Сохранение ----
    async function handleSave() {
        const data = await save();
        if (data && data.success) {
            setCreatedAny(true);
            setCreatedBooking({
                clientName: clientName.trim(),
                date: selectedDate,
                time: selectedTime,
                slotEnd: selectedSlotEnd,
                clientAddress: isAway ? clientAddress.trim() : '',
                services: selectedServices.map(s => ({
                    name: s.name,
                    category: s.category_name || null,
                })),
                totalDuration,
                totalPrice,
                isAway,
            });
        }
    }

    // ---- «Записать ещё» ----
    function handleCreateAnother() {
        setCreatedBooking(null);
        reset();
        // createdAny остаётся true — запись уже создана
        setTimeout(() => {
            const body = document.querySelector(`.${shared.body}`);
            if (body) body.scrollTop = 0;
        }, 100);
    }

    // ---- «Готово» ----
    // onCreated вызываем напрямую, а не через handleClose,
    // чтобы не было двойного вызова.
    function handleFinish() {
        if (onCreated) onCreated();
        onClose();
    }

    // ---- Отображение слота ----
    function renderSlotLabel(slot) {
        if (slot.end && slot.end !== slot.start) {
            return `${slot.start}—${slot.end}`;
        }
        return slot.start;
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
                        onClick={handleClose}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className={shared.body}>
                    {createdBooking ? (
                        <div className={shared.successBox}>
                            <div className={shared.successIcon}><i className="fas fa-check-circle" /></div>
                            <h4 className={shared.successTitle}>Запись создана!</h4>
                            <div className={shared.successDetails}>
                                <p>
                                    <strong>{createdBooking.clientName}</strong> записан(а) на{' '}
                                    <strong>{formatDate(createdBooking.date)}</strong> в{' '}
                                    <strong>
                                        {createdBooking.time}
                                        {createdBooking.slotEnd && createdBooking.slotEnd !== createdBooking.time
                                            ? `—${createdBooking.slotEnd}` : ''}
                                    </strong>
                                </p>
                                <p className={shared.successServices}>
                                    {createdBooking.services.map((s, i) => (
                                        <span key={i}>
                                            {s.category && <span className={shared.successCategory}>{s.category}: </span>}
                                            {s.name}
                                            {i < createdBooking.services.length - 1 && ', '}
                                        </span>
                                    ))}
                                </p>
                                {createdBooking.isAway && createdBooking.clientAddress && (
                                    <p className={shared.successMeta}>
                                        <i className="fas fa-map-marker-alt me-1" />
                                        {createdBooking.clientAddress}
                                    </p>
                                )}
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
                                    <label className={shared.sectionLabel}>Шаг 1: Выберите услуги (до 3)</label>

                                    <ServiceCards
                                        categories={categories}
                                        uncategorized={uncategorized}
                                        selectedIds={selectedServices.map(s => s.id)}
                                        onToggle={toggleService}
                                        showCloseButton={true}
                                    />

                                    {selectedServices.length > 0 && (
                                        <>
                                            <label className={`${shared.sectionLabel} ${shared.sectionLabelTop}`}>
                                                Шаг 2: Дата и время
                                            </label>

                                            <DateGrid
                                                dates={availableDates}
                                                selectedDate={selectedDate}
                                                onSelect={handleDateClick}
                                                loading={loadingDates}
                                            />

                                            {selectedDate && (
                                                <div ref={slotsRef}>
                                                    <SlotGrid
                                                        slots={availableSlots}
                                                        selectedTime={selectedTime}
                                                        onSelect={handleTimeClick}
                                                        loading={loadingSlots}
                                                        renderLabel={renderSlotLabel}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {selectedTime && (
                                        <>
                                            <BookingSummary
                                                services={selectedServices}
                                                date={selectedDate}
                                                time={selectedTime}
                                                slotEnd={selectedSlotEnd}
                                                totalDuration={totalDuration}
                                                totalPrice={totalPrice}
                                                innerRef={summaryRef}
                                            />

                                            <label className={shared.sectionLabel}>Шаг 3: Данные клиента</label>
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
                                                travelBefore={travelBefore}
                                                onTravelBeforeChange={setTravelBefore}
                                                travelAfter={travelAfter}
                                                onTravelAfterChange={setTravelAfter}
                                                durationExtra={durationExtra}
                                                onDurationExtraChange={setDurationExtra}
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
                        <>
                            {allowCreateAnother && (
                                <button type="button" className={shared.btnSecondary} onClick={handleCreateAnother}>
                                    Записать ещё
                                </button>
                            )}
                            <button type="button" className={shared.btnPink} onClick={handleFinish}>
                                Готово
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className={shared.btnSecondary} onClick={handleClose} disabled={saving}>
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