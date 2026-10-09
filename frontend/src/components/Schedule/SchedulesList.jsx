import React from 'react';
import useModal from '../../hooks/useModal';
import { deleteSchedule } from '../../api/schedule';
import styles from './SchedulesList.module.css';

export default function SchedulesList({
    schedules,
    loading,
    onEdit,
    onDataChanged,
}) {
    const { showAlert, showConfirm } = useModal();

    async function handleDelete(schedule) {
        const ok = await showConfirm(
            `Удалить расписание для ${schedule.day_name}?`,
            { type: 'danger' }
        );
        if (!ok) return;

        try {
            const data = await deleteSchedule(schedule.id);
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

    if (schedules.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p className={styles.emptyText}>У вас пока нет настроенного расписания</p>
                <p className={styles.emptyHint}>Добавьте рабочие дни, чтобы клиенты могли записываться</p>
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>День недели</th>
                        <th>Начало</th>
                        <th>Конец</th>
                        <th>Перерывы</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {schedules.map(schedule => (
                        <tr key={schedule.id}>
                            <td data-label="day">
                                <strong>{schedule.day_name}</strong>
                            </td>
                            <td data-label="start">
                                <span className={styles.workTimeDesktop}>
                                    {schedule.start_time}
                                </span>
                                <span className={styles.workTimeMobile}>
                                    {schedule.start_time} - {schedule.end_time}
                                </span>
                            </td>
                            <td data-label="end">{schedule.end_time}</td>
                            <td data-label="breaks">
                                {schedule.breaks && schedule.breaks.length > 0 ? (
                                    schedule.breaks.map((b, i) => (
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
                                        className={styles.iconBtn}
                                        onClick={() => onEdit(schedule)}
                                        title="Изменить"
                                    >
                                        <i className="fas fa-edit" />
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                        onClick={() => handleDelete(schedule)}
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