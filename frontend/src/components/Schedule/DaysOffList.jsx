import React from 'react';
import useModal from '../../hooks/useModal';
import { deleteDayOff } from '../../api/schedule';
import styles from './DaysOffList.module.css';

export default function DaysOffList({ daysOff, loading, onDataChanged }) {
    const { showAlert, showConfirm } = useModal();

    // Фильтруем будущие (с сегодня и позже)
    const today = new Date().toISOString().split('T')[0];
    const futureDays = daysOff.filter(d => d.date >= today);

    async function handleDelete(day) {
        const ok = await showConfirm('Удалить этот выходной день?', { type: 'danger' });
        if (!ok) return;

        try {
            const data = await deleteDayOff(day.id);
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

    if (futureDays.length === 0) {
        return <p className={styles.emptyText}>Нет предстоящих выходных</p>;
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Причина</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {futureDays.map(day => (
                        <tr key={day.id}>
                            <td data-label="date">
                                <strong>{day.date_display}</strong>
                            </td>
                            <td data-label="reason">{day.reason || '—'}</td>
                            <td data-label="actions">
                                <div className={styles.actionIcons}>
                                    <button
                                        type="button"
                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                        onClick={() => handleDelete(day)}
                                        title="Удалить"
                                    >
                                        <i className="fas fa-trash" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}