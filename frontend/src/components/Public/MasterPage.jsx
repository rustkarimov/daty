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
    const [selectedTime, setSelectedTime] = useState(null);  // { start, end }
    const [confirmedBooking, setConfirmedBooking] = useState(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const isAway = masterMode === 'away';

    function handleReset() {
        setSelectedServices([]);
        setSelectedDate(null);
        setSelectedTime(null);
        setConfirmedBooking(null);
    }

    function handleServicesChange(services) {
        setSelectedServices(services);
        setSelectedDate(null);
        setSelectedTime(null);
    }

    function handleDateChange(d) {
        setSelectedDate(d);
        setSelectedTime(null);
    }

    function handleTimeChange(t) {
        // t = { start, end }
        setSelectedTime(t);
    }

    function handleBookingSuccess(result) {
        setConfirmedBooking(result);
    }

    const showDates = selectedServices.length > 0;
    const showTimes = showDates && selectedDate !== null;
    const showForm = showTimes && selectedTime !== null;

    return (
        <div className={styles.page}>
            <div className={styles.headerActions}>
                <button
                    type="button"
                    className="btn btn-outline-pink"
                    onClick={() => setAuthModalOpen(true)}
                >
                    Изменить мои записи
                </button>
            </div>

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

            {authModalOpen && (
                <ClientAuthModal
                    identifier={identifier}
                    onClose={() => setAuthModalOpen(false)}
                />
            )}
        </div>
    );
}