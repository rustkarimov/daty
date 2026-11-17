// frontend/src/components/Schedule/VacationList.jsx
import React from 'react';
import useModal from '../../hooks/useModal';
import { deleteVacation } from '../../api/schedule';
import styles from './DaysOffList.module.css';


function pluralizeDays(n) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return 'дней';
    if (n1 > 1 && n1 < 5) return 'дня';
    if (n1 === 1) return 'день';
    return 'дней';
}

export default function VacationList({ vacations, loading, onDataChanged }) {
    const { showAlert, showConfirm } = useModal();

    async function handleDelete(v) {
        const ok = await showConfirm(
            `Удалить отпуск с ${v.start_display} по ${v.end_display}?`,
            { type: 'danger' }
        );
        if (!ok) return;

        try {
            const data = await deleteVacation(v.id);
            if (data.success) {
                onDataChanged();
            } else {
                showAlert(data.error || 'Ошибка удаления', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        }
    }

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner-border" style={{ color: 'var(--primary)' }} />
            </div>
        );
    }

    if (vacations.length === 0) {
        return <p className={styles.emptyText}>Нет запланированных отпусков</p>;
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Период</th>
                        <th>Дней</th>
                        <th>Причина</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {vacations.map(v => {
                        const daysWord = pluralizeDays(v.days_count);
                        return (
                            <tr key={v.id}>
                                <td data-label="date">
                                    <strong>
                                        {v.start_display} — {v.end_display}
                                    </strong>
                                </td>
                                <td data-label="days">
                                    {v.days_count} {daysWord}
                                </td>
                                <td data-label="reason">
                                    {v.reason || ''}
                                </td>
                                <td data-label="actions">
                                    <div className={styles.actionIcons}>
                                        <button
                                            type="button"
                                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                            onClick={() => handleDelete(v)}
                                            title="Удалить"
                                        >
                                            <i className="fas fa-trash" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}