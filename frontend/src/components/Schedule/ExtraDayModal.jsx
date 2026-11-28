import React, { useState, useEffect } from 'react';
import BreaksEditor from '../Dashboard/Calendar/BreaksEditor';
import useModal from '../../hooks/useModal';
import { addExtraDay, getExtraDay } from '../../api/schedule';
import styles from './ExtraDayModal.module.css';
import useBodyLock from '../../hooks/useBodyLock';

export default function ExtraDayModal({ 
    mode = 'add', 
    extraDayId = null, 
    schedules = [], 
    onClose, 
    onSaved 
}) {
    useBodyLock();
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [breaks, setBreaks] = useState([]);
    const [breakDraft, setBreakDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');
    
    const { showAlert, showConfirm } = useModal();
    const today = new Date().toISOString().split('T')[0];

    // Загрузка данных при редактировании
    useEffect(() => {
        if (mode === 'edit' && extraDayId) {
            getExtraDay(extraDayId)
                .then(res => {
                    if (res.success) {
                        setDate(res.data.date);
                        setStartTime(res.data.start_time);
                        setEndTime(res.data.end_time);
                        setBreaks(res.data.breaks || []);
                    } else {
                        showAlert(res.error || 'Ошибка загрузки', 'error');
                        onClose();
                    }
                })
                .catch(() => {
                    showAlert('Ошибка соединения', 'error');
                    onClose();
                })
                .finally(() => setLoading(false));
        }
    }, [mode, extraDayId, showAlert, onClose]);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    // Проверка конфликта с регулярным расписанием (эта функция потерялась)
    async function checkDayConflict(dateStr) {
        if (!dateStr) return true;

        const selectedDate = new Date(dateStr);
        const jsDay = selectedDate.getDay(); // 0=вс, 1=пн, ..., 6=сб
        // Django: 0=пн, 6=вс
        const djangoDay = jsDay === 0 ? 6 : jsDay - 1;

        const matched = schedules.find(s => s.day_of_week === djangoDay);
        if (!matched) return true;

        // Если мы редактируем этот же день, не показываем конфликт
        if (mode === 'edit') return true;

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

        let finalBreaks = [...breaks];
        if (breakDraft && breakDraft.newBreak && breakDraft.newBreak.start && breakDraft.newBreak.end) {
            finalBreaks.push(breakDraft.newBreak);
        }

        const validBreaks = finalBreaks.filter(b => b.start && b.end);
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
            const payload = {
                date,
                start_time: startTime,
                end_time: endTime,
                breaks: validBreaks,
            };
            if (mode === 'edit') payload.id = extraDayId;

            const data = await addExtraDay(payload);

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

    if (loading) {
        return (
            <div className={styles.backdrop}>
                <div className={styles.modal} style={{ padding: 40, textAlign: 'center' }}>
                    <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className={`fas ${mode === 'edit' ? 'fa-edit' : 'fa-plus'}`} />
                        {mode === 'edit' ? 'Редактировать допдень' : 'Добавить допдень'}
                    </h5>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
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

                        <BreaksEditor
                            breaks={breaks}
                            onChange={setBreaks}
                            onDraftChange={setBreakDraft}
                            minTime={startTime}
                            maxTime={endTime}
                        />
                    </form>
                </div>

                <div className={styles.footer}>
                    <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>Отмена</button>
                    <button type="submit" form="extra-day-form" className={styles.btnPrimary} disabled={saving}>
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}