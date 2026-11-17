// frontend/src/components/Schedule/DayOffModal.jsx
import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import { addDayOff, addVacation, checkVacationConflicts } from '../../api/schedule';
import styles from './DayOffModal.module.css';
import useBodyLock from '../../hooks/useBodyLock';

export default function DayOffModal({ onClose, onSaved }) {
    useBodyLock();
    const { showAlert, showConfirm } = useModal();

    // ---- Выходной (один день) ----
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [savingDayOff, setSavingDayOff] = useState(false);

    // ---- Отпуск (диапазон) ----
    const [vacationStart, setVacationStart] = useState('');
    const [vacationEnd, setVacationEnd] = useState('');
    const [vacationReason, setVacationReason] = useState('');
    const [savingVacation, setSavingVacation] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    async function handleSaveDayOff(e) {
        e.preventDefault();
        if (!date) {
            showAlert('Выберите дату', 'warning');
            return;
        }

        setSavingDayOff(true);
        try {
            const data = await addDayOff({ date, reason: reason.trim() });
            if (data.success) {
                onSaved();
                onClose();
                if (data.message) showAlert(data.message, 'success');
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSavingDayOff(false);
        }
    }

    function handleVacationStartChange(e) {
        const value = e.target.value;
        setVacationStart(value);
        if (!vacationEnd || vacationEnd < value) {
            setVacationEnd(value);
        }
    }

    async function handleSaveVacation(e) {
        e.preventDefault();
        if (!vacationStart || !vacationEnd) {
            showAlert('Выберите даты начала и окончания', 'warning');
            return;
        }
        if (vacationEnd < vacationStart) {
            showAlert('Дата окончания не может быть раньше начала', 'warning');
            return;
        }

        setSavingVacation(true);
        try {
            const check = await checkVacationConflicts({
                start_date: vacationStart,
                end_date: vacationEnd,
            });

            if (check.success && check.data && check.data.has_conflicts) {
                const ok = await showConfirm(check.data.message, {
                    type: 'warning',
                    title: 'Есть конфликты',
                    confirmText: 'Продолжить',
                    cancelText: 'Отмена',
                });
                if (!ok) {
                    setSavingVacation(false);
                    return;
                }
            }

            const data = await addVacation({
                start_date: vacationStart,
                end_date: vacationEnd,
                reason: vacationReason.trim(),
            });

            if (data.success) {
                onSaved();
                onClose();
                if (data.data && data.data.message) {
                    showAlert(data.data.message, 'success');
                }
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSavingVacation(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-calendar-times" />
                        Выходной и отпуск
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
                    {/* ---- Выходной день ---- */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            marginBottom: 10,
                            color: '#1a1a2e',
                        }}>
                            <i className="fas fa-calendar-times me-2" style={{ color: 'var(--primary)' }} />
                            Выходной день
                        </div>

                        <form id="day-off-form" onSubmit={handleSaveDayOff}>
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
                                    placeholder="Например: больничный"
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.btnPrimary}
                                disabled={savingDayOff}
                                style={{ marginTop: 4 }}
                            >
                                {savingDayOff ? (
                                    <><i className="fas fa-spinner fa-spin" /> Сохранение...</>
                                ) : (
                                    <><i className="fas fa-check" /> Сохранить выходной</>
                                )}
                            </button>
                        </form>
                    </div>

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />

                    {/* ---- Отпуск ---- */}
                    <div>
                        <div style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            marginBottom: 10,
                            color: '#1a1a2e',
                        }}>
                            <i className="fas fa-plane me-2" style={{ color: 'var(--primary)' }} />
                            Отпуск (несколько дней)
                        </div>

                        <form id="vacation-form" onSubmit={handleSaveVacation}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Дата начала</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={vacationStart}
                                    min={today}
                                    onChange={handleVacationStartChange}
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}>
                                    Дата окончания
                                    <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4 }}>
                                        (включительно)
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={vacationEnd}
                                    min={vacationStart || today}
                                    onChange={e => setVacationEnd(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Причина (необязательно)</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={vacationReason}
                                    onChange={e => setVacationReason(e.target.value)}
                                    placeholder="Например: отпуск, праздники"
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.btnPrimary}
                                disabled={savingVacation}
                                style={{ marginTop: 4 }}
                            >
                                {savingVacation ? (
                                    <><i className="fas fa-spinner fa-spin" /> Сохранение...</>
                                ) : (
                                    <><i className="fas fa-plane" /> Сохранить отпуск</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}