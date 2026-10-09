import React, { useState } from 'react';
import BreaksEditor from '../Calendar/BreaksEditor';
import useModal from '../../hooks/useModal';
import { addExtraDay } from '../../api/schedule';
import styles from './ExtraDayModal.module.css';

export default function ExtraDayModal({ schedules = [], onClose, onSaved }) {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [breaks, setBreaks] = useState([]);
    const [saving, setSaving] = useState(false);
    const { showAlert, showConfirm } = useModal();

    // Минимальная дата — сегодня
    const today = new Date().toISOString().split('T')[0];

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    // Проверка конфликта с регулярным расписанием
    async function checkDayConflict(dateStr) {
        if (!dateStr) return true;

        const selectedDate = new Date(dateStr);
        const jsDay = selectedDate.getDay(); // 0=вс, 1=пн, ..., 6=сб
        // Django: 0=пн, 6=вс
        const djangoDay = jsDay === 0 ? 6 : jsDay - 1;

        const matched = schedules.find(s => s.day_of_week === djangoDay);
        if (!matched) return true;

        return await showConfirm(
            `Выбранный день (${matched.day_name}) уже есть в регулярном расписании.\n\n` +
            `Дополнительный рабочий день будет иметь приоритет над регулярным.\n\n` +
            `Продолжить?`,
            { type: 'warning' }
        );
    }

    async function handleDateChange(e) {
        const newDate = e.target.value;
        if (!newDate) {
            setDate('');
            return;
        }
        const ok = await checkDayConflict(newDate);
        if (ok) {
            setDate(newDate);
        }
    }

    async function handleSave(e) {
        e.preventDefault();

        if (!date || !startTime || !endTime) {
            showAlert('Заполните все обязательные поля', 'warning');
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

        // Проверка на пересечение перерывов
        for (let i = 0; i < validBreaks.length; i++) {
            for (let j = i + 1; j < validBreaks.length; j++) {
                if (validBreaks[i].start < validBreaks[j].end && validBreaks[j].start < validBreaks[i].end) {
                    showAlert(
                        `Перерывы ${validBreaks[i].start}-${validBreaks[i].end} и ${validBreaks[j].start}-${validBreaks[j].end} пересекаются`,
                        'warning'
                    );
                    return;
                }
            }
        }

        setSaving(true);
        try {
            const data = await addExtraDay({
                date,
                start_time: startTime,
                end_time: endTime,
                breaks: validBreaks,
            });

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

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-plus" />
                        Добавить допдень
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
                    <form id="extra-day-form" onSubmit={handleSave}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Дата</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={date}
                                min={today}
                                onChange={handleDateChange}
                                required
                            />
                        </div>

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
                        form="extra-day-form"
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