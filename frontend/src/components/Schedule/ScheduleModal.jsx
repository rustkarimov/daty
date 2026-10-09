import React, { useState, useEffect } from 'react';
import BreaksEditor from '../Calendar/BreaksEditor';
import useModal from '../../hooks/useModal';
import { addSchedule, editSchedule } from '../../api/schedule';
import styles from './ScheduleModal.module.css';

const DAYS = [
    { value: 0, label: 'Понедельник' },
    { value: 1, label: 'Вторник' },
    { value: 2, label: 'Среда' },
    { value: 3, label: 'Четверг' },
    { value: 4, label: 'Пятница' },
    { value: 5, label: 'Суббота' },
    { value: 6, label: 'Воскресенье' },
];

export default function ScheduleModal({ mode = 'add', schedule = null, onClose, onSaved }) {
    const [dayOfWeek, setDayOfWeek] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [breaks, setBreaks] = useState([]);
    const [saving, setSaving] = useState(false);

    const { showAlert } = useModal();

    // Инициализация при редактировании
    useEffect(() => {
        if (mode === 'edit' && schedule) {
            setDayOfWeek(schedule.day_of_week);
            setStartTime(schedule.start_time);
            setEndTime(schedule.end_time);
            setBreaks(schedule.breaks || []);
        }
    }, [mode, schedule]);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    async function handleSave(e) {
        e.preventDefault();

        if (dayOfWeek === '' || dayOfWeek === null || dayOfWeek === undefined) {
            showAlert('Выберите день недели', 'warning');
            return;
        }
        if (!startTime || !endTime) {
            showAlert('Заполните время начала и окончания', 'warning');
            return;
        }
        if (startTime >= endTime) {
            showAlert('Время начала не может быть позже времени окончания', 'warning');
            return;
        }

        // Проверка перерывов
        const validBreaks = breaks.filter(b => b.start && b.end);
        for (const b of validBreaks) {
            if (b.start >= b.end) {
                showAlert(`Перерыв ${b.start}-${b.end}: время начала не может быть позже окончания`, 'warning');
                return;
            }
            if (b.start < startTime || b.end > endTime) {
                showAlert(`Перерыв ${b.start}-${b.end} выходит за пределы рабочего дня (${startTime}-${endTime})`, 'warning');
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                day_of_week: parseInt(dayOfWeek),
                start_time: startTime,
                end_time: endTime,
                breaks: validBreaks,
            };

            const data = mode === 'edit'
                ? await editSchedule(schedule.id, payload)
                : await addSchedule(payload);

            if (data.success) {
                onSaved();
                onClose();
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSaving(false);
        }
    }

    const titleIcon = mode === 'edit' ? 'fa-edit' : 'fa-plus';
    const titleText = mode === 'edit' ? 'Редактировать расписание' : 'Добавить рабочий день';

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className={`fas ${titleIcon}`} />
                        {titleText}
                    </h5>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <form id="schedule-form" onSubmit={handleSave}>
                        {/* День недели */}
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>День недели</label>
                            {mode === 'edit' ? (
                                <div className={styles.dayDisplay}>
                                    {schedule?.day_name}
                                </div>
                            ) : (
                                <select
                                    className={styles.formSelect}
                                    value={dayOfWeek}
                                    onChange={e => setDayOfWeek(e.target.value)}
                                >
                                    <option value="">Выберите день</option>
                                    {DAYS.map(d => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Часы работы */}
                        <div className={styles.row}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Начало работы</label>
                                <input
                                    type="time"
                                    className={styles.formInput}
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Конец работы</label>
                                <input
                                    type="time"
                                    className={styles.formInput}
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Перерывы */}
                        <BreaksEditor breaks={breaks} onChange={setBreaks} />
                    </form>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        form="schedule-form"
                        className={styles.btnPrimary}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                Сохранение...
                            </>
                        ) : (
                            'Сохранить'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}