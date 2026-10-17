import React, { useState, useEffect } from 'react';
import { loadAvailableSlots } from '../../api/publicBooking';
import styles from './TimesStep.module.css';

export default function TimesStep({
    identifier,
    selectedServices,
    selectedDate,
    selectedTime,
    onChange,
}) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fullDuration, setFullDuration] = useState(0);

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

    useEffect(() => {
        if (!selectedDate) return;
        setLoading(true);
        loadAvailableSlots(identifier, totalDuration, selectedDate)
            .then(data => {
                setSlots(data.slots || []);
                setFullDuration(data.full_duration || totalDuration);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки слотов:', error);
                setLoading(false);
            });
    }, [identifier, totalDuration, selectedDate]);

    return (
        <div className="card mb-4">
            <div className="card-header bg-white">
                <h5 className="mb-0">
                    <i className="far fa-clock me-2" style={{ color: 'var(--primary)' }} />
                    Шаг 3: Выберите время
                </h5>
            </div>
            <div className="card-body">
                {loading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : slots.length === 0 ? (
                    <p className="text-muted text-center">Нет свободного времени в этот день</p>
                ) : (
                    <>
                        {fullDuration > totalDuration && (
                            <p className="text-muted small mb-2">
                                <i className="fas fa-info-circle me-1" />
                                С учётом времени на дорогу запись займёт {fullDuration} мин
                            </p>
                        )}
                        <div className="row">
                            {slots.map(slot => (
                                <div key={slot.start} className="col-4 col-md-2 mb-3">
                                    <div
                                        className={`${styles.slotCard} ${selectedTime === slot.start ? styles.selected : ''}`}
                                        onClick={() => onChange(slot.start)}
                                    >
                                        {slot.start}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}