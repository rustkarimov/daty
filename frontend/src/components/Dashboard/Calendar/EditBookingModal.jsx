// frontend/src/components/Dashboard/Calendar/EditBookingModal.jsx
import React, { useRef } from 'react';
import shared from './BookingModalShared.module.css';
import useModal from '../../../hooks/useModal';
import useBodyLock from '../../../hooks/useBodyLock';
import useBookingForm from './useBookingForm';
import { loadBookingForEdit } from '../../../api/day';
import ServiceCards from './ServiceCards';
import DateGrid from './DateGrid';
import SlotGrid from './SlotGrid';
import BookingSummary from './BookingSummary';
import ClientForm from './ClientForm';

export default function EditBookingModal({ bookingId, masterSlug, onClose, onSaved }) {
    useBodyLock();
    const { showAlert } = useModal();

    const slotsRef = useRef(null);
    const summaryRef = useRef(null);

    // Состояние для нахождения услуги и статуса — загружаем отдельно,
    // чтобы передать в хук.
    const [form, setForm] = React.useState(null);

    React.useEffect(() => {
        // Загружаем данные для инициализации хука (service_id, status, service_mode)
        loadBookingForEdit(bookingId)
            .then(data => setForm(data))
            .catch(error => {
                console.error('Ошибка загрузки записи:', error);
                showAlert('Не удалось загрузить запись', 'error');
            });
    }, [bookingId, showAlert]);

    return (
        <EditBookingModalInner
            bookingId={bookingId}
            masterSlug={masterSlug}
            onClose={onClose}
            onSaved={onSaved}
            form={form}
            showAlert={showAlert}
            slotsRef={slotsRef}
            summaryRef={summaryRef}
        />
    );
}

function EditBookingModalInner({
    bookingId,
    masterSlug,
    onClose,
    onSaved,
    form,
    showAlert,
    slotsRef,
    summaryRef,
}) {
    // Пока form не загружен — показываем спиннер (внутри модала)
    if (!form) {
        return (
            <div className={shared.backdrop} onClick={handleBackdropClick}>
                <div className={shared.modal} onClick={e => e.stopPropagation()}>
                    <div className={shared.header}>
                        <h5 className={shared.title}>
                            <i className="fas fa-edit" style={{ color: 'var(--primary)' }} />
                            Редактирование записи
                        </h5>
                        <button type="button" className={shared.closeBtn} onClick={onClose} aria-label="Закрыть">✕</button>
                    </div>
                    <div className={shared.body}>
                        <div className={shared.loading}>
                            <div className="spinner-border" style={{ color: '#4053d3' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <EditBookingModalForm
            bookingId={bookingId}
            masterSlug={masterSlug}
            onClose={onClose}
            onSaved={onSaved}
            form={form}
            showAlert={showAlert}
            slotsRef={slotsRef}
            summaryRef={summaryRef}
        />
    );

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }
}

function EditBookingModalForm({
    bookingId,
    masterSlug,
    onClose,
    onSaved,
    form,
    showAlert,
    slotsRef,
    summaryRef,
}) {
    const bookingForm = useBookingForm({
        mode: 'edit',
        masterSlug,
        bookingId,
        initialStatus: form.status || 'confirmed',
        initialServiceId: form.service_id,
        initialServiceMode: form.service_mode,
        onSaved,
    });

    const {
        categories,
        uncategorized,
        loading,
        loadingDates,
        loadingSlots,
        saving,
        selectedService,
        selectService,
        totalDuration,
        totalPrice,
        availableDates,
        availableSlots,
        selectedDate,
        selectedTime,
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
        save,
        isAway,
    } = bookingForm;

    // Скролл к датам после выбора услуги
    const shouldScrollToDates = useRef(false);
    const datesRef = useRef(null);
    const bodyRef = useRef(null);

    React.useEffect(() => {
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

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    function handleServiceClick(service) {
        selectService(service);
        shouldScrollToDates.current = true;
    }

    function handleDateClick(date) {
        selectDate(date);
        setTimeout(() => {
            if (slotsRef.current) {
                slotsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    function handleTimeClick(slot) {
        // В edit слот приходит как объект { start, end }
        selectTime(slot);
        setTimeout(() => {
            if (summaryRef.current) {
                summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    async function handleSave() {
        const data = await save();
        if (data && data.success) {
            onClose();
        }
    }

    return (
        <div className={shared.backdrop} onClick={handleBackdropClick}>
            <div className={shared.modal} onClick={e => e.stopPropagation()}>
                <div className={shared.header}>
                    <h5 className={shared.title}>
                        <i className="fas fa-edit" style={{ color: 'var(--primary)' }} />
                        Редактирование записи
                    </h5>
                    <button type="button" className={shared.closeBtn} onClick={onClose} aria-label="Закрыть">✕</button>
                </div>

                <div className={shared.body} ref={bodyRef}>
                    {loading ? (
                        <div className={shared.loading}>
                            <div className="spinner-border" style={{ color: '#4053d3' }} />
                        </div>
                    ) : (
                        <>
                            <label className={shared.sectionLabel}>Услуга</label>

                            <ServiceCards
                                categories={categories}
                                uncategorized={uncategorized}
                                selectedIds={selectedService ? [selectedService.id] : []}
                                onToggle={handleServiceClick}
                                showCloseButton={false}
                            />

                            {selectedService && (
                                <>
                                    <label className={`${shared.sectionLabel} ${shared.sectionLabelTop}`}>
                                        Дата и время
                                    </label>

                                    <div ref={datesRef}>
                                        <DateGrid
                                            dates={availableDates}
                                            selectedDate={selectedDate}
                                            onSelect={handleDateClick}
                                            loading={loadingDates}
                                        />
                                    </div>

                                    {selectedDate && (
                                        <div ref={slotsRef}>
                                            <SlotGrid
                                                slots={availableSlots}
                                                selectedTime={selectedTime}
                                                onSelect={handleTimeClick}
                                                loading={loadingSlots}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedTime && (
                                <>
                                    <BookingSummary
                                        services={selectedService ? [selectedService] : []}
                                        date={selectedDate}
                                        time={selectedTime}
                                        totalDuration={selectedService?.duration || 0}
                                        totalPrice={selectedService?.price || 0}
                                        innerRef={summaryRef}
                                        single={true}
                                    />

                                    <label className={shared.sectionLabel}>Данные клиента</label>
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