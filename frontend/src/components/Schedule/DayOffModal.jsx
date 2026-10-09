import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import { addDayOff } from '../../api/schedule';
import styles from './DayOffModal.module.css';

export default function DayOffModal({ onClose, onSaved }) {
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const { showAlert } = useModal();

    const today = new Date().toISOString().split('T')[0];

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    async function handleSave(e) {
        e.preventDefault();

        if (!date) {
            showAlert('Выберите дату', 'warning');
            return;
        }

        setSaving(true);
        try {
            const data = await addDayOff({ date, reason: reason.trim() });

            if (data.success) {
                onSaved();
                onClose();
                // Уведомление покажет родитель через AlertModal (если нужно)
                if (data.message) {
                    showAlert(data.message, 'success');
                }
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
                        <i className="fas fa-calendar-times" />
                        Добавить выходной день
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
                    <form id="day-off-form" onSubmit={handleSave}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Дата</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={date}
                                min={today}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Причина (необязательно)</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Например: Отпуск, больничный, праздник"
                            />
                        </div>
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
                        form="day-off-form"
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