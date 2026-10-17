import React, { useState } from 'react';
import ServicesStep from './ServicesStep';
import DatesStep from './DatesStep';
import TimesStep from './TimesStep';
import ClientFormStep from './ClientFormStep';
import ConfirmationStep from './ConfirmationStep';
import ClientAuthModal from './ClientAuthModal';
import styles from './MasterPage.module.css';

export default function MasterPage({
    identifier,
    masterMode,
    masterAddress,
    travelTime,
}) {
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [confirmedBooking, setConfirmedBooking] = useState(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const isAway = masterMode === 'away';

    // Сброс (после «Записаться ещё»)
    function handleReset() {
        setSelectedServices([]);
        setSelectedDate(null);
        setSelectedTime(null);
        setConfirmedBooking(null);
    }

    // Услуга добавлена/удалена
    function handleServicesChange(services) {
        setSelectedServices(services);
        // При изменении услуг — сбрасываем дату/время (если уже выбраны)
        if (services.length === 0) {
            setSelectedDate(null);
            setSelectedTime(null);
        } else {
            // Меняется длительность — пересчёт дат/слотов
            setSelectedDate(null);
            setSelectedTime(null);
        }
    }

    // Дата выбрана
    function handleDateChange(d) {
        setSelectedDate(d);
        setSelectedTime(null);
    }

    // Время выбрано
    function handleTimeChange(t) {
        setSelectedTime(t);
    }

    // Запись создана
    function handleBookingSuccess(result) {
        setConfirmedBooking(result);
    }

    const showDates = selectedServices.length > 0;
    const showTimes = showDates && selectedDate !== null;
    const showForm = showTimes && selectedTime !== null;

    return (
        <div className={styles.page}>
            {/* Кнопка «Мои записи» */}
            <div className={styles.headerActions}>
                <button
                    type="button"
                    className="btn btn-outline-pink"
                    onClick={() => setAuthModalOpen(true)}
                >
                    Изменить мои записи
                </button>
            </div>

            {/* Шаги */}
            {!confirmedBooking && (
                <>
                    <ServicesStep
                        identifier={identifier}
                        selectedServices={selectedServices}
                        onChange={handleServicesChange}
                    />

                    {showDates && (
                        <DatesStep
                            identifier={identifier}
                            selectedServices={selectedServices}
                            selectedDate={selectedDate}
                            onChange={handleDateChange}
                        />
                    )}

                    {showTimes && (
                        <TimesStep
                            identifier={identifier}
                            selectedServices={selectedServices}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            onChange={handleTimeChange}
                        />
                    )}

                    {showForm && (
                        <ClientFormStep
                            identifier={identifier}
                            selectedServices={selectedServices}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            isAway={isAway}
                            onSuccess={handleBookingSuccess}
                        />
                    )}
                </>
            )}

            {/* Экран успеха */}
            {confirmedBooking && (
                <ConfirmationStep
                    result={confirmedBooking}
                    isAway={isAway}
                    selectedServices={selectedServices}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    clientAddress={confirmedBooking.clientAddress}
                    onReset={handleReset}
                />
            )}

            {/* Модалка авторизации */}
            {authModalOpen && (
                <ClientAuthModal
                    identifier={identifier}
                    onClose={() => setAuthModalOpen(false)}
                />
            )}
        </div>
    );
}