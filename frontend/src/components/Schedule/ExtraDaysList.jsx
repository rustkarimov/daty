import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import { deleteExtraDay } from '../../api/schedule';
import styles from './ExtraDaysList.module.css';

export default function ExtraDaysList({
    futureDays,
    pastDays,
    pastDaysHasMore,
    loading,
    onLoadMorePast,
    onDataChanged,
}) {
    const [pastOpen, setPastOpen] = useState(false);
    const { showAlert, showConfirm } = useModal();

    async function handleDelete(day) {
        const ok = await showConfirm(
            'Удалить этот дополнительный рабочий день?',
            { type: 'danger' }
        );
        if (!ok) return;

        try {
            const data = await deleteExtraDay(day.id);
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

    return (
        <>
            {futureDays.length === 0 && pastDays.length === 0 ? (
                <p className={styles.emptyText}>Нет дополнительных рабочих дней</p>
            ) : (
                <>
                    {futureDays.length > 0 && (
                        <>
                            <div className={styles.subtitle}>Предстоящие:</div>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Дата</th>
                                            <th>Время</th>
                                            <th>Перерывы</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {futureDays.map(day => (
                                            <tr key={day.id}>
                                                <td data-label="day">
                                                    <strong>{day.date_display}</strong>
                                                </td>
                                                <td data-label="start">
                                                    {day.start_time} - {day.end_time}
                                                </td>
                                                <td data-label="breaks">
                                                    {day.breaks && day.breaks.length > 0 ? (
                                                        day.breaks.map((b, i) => (
                                                            <span key={i} className={styles.breakText}>
                                                                {b.start} - {b.end}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className={styles.textMuted}>—</span>
                                                    )}
                                                </td>
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
                        </>
                    )}

                    {/* Прошедшие — сворачиваемый блок */}
                    <details
                        className={styles.pastDetails}
                        open={pastOpen}
                        onToggle={e => setPastOpen(e.target.open)}
                    >
                        <summary className={styles.pastSummary}>Прошедшие</summary>
                        <div className={styles.pastContent}>
                            {pastDays.length === 0 ? (
                                <p className={styles.emptyText}>Нет прошедших дополнительных дней</p>
                            ) : (
                                <>
                                    <div className={styles.tableWrapper}>
                                        <table className={`${styles.table} ${styles.tableSmall}`}>
                                            <thead>
                                                <tr>
                                                    <th>Дата</th>
                                                    <th>Время</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pastDays.map(day => (
                                                    <tr key={day.id}>
                                                        <td data-label="">{day.date_display}</td>
                                                        <td data-label="">
                                                            {day.start_time} - {day.end_time}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {pastDaysHasMore && (
                                        <div className={styles.loadMoreWrapper}>
                                            <button
                                                type="button"
                                                className={styles.btnOutline}
                                                onClick={onLoadMorePast}
                                            >
                                                Загрузить ещё
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </details>
                </>
            )}
        </>
    );
}