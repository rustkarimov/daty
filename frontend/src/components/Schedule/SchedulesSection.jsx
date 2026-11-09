// frontend/src/components/Schedule/SchedulesSection.jsx
//
// Секция «Регулярная работа»: список дней недели + кнопка «Добавить».

import React from 'react';
import SchedulesList from './SchedulesList';
import styles from './SchedulePage.module.css';

export default function SchedulesSection({
    schedules,
    loading,
    onEdit,
    onDelete,
    onDataChanged,
    onAdd,
}) {
    return (
        <div className={styles.card}>
            <div className={styles.sectionTitle}>Регулярная работа</div>

            <SchedulesList
                schedules={schedules}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
                onDataChanged={onDataChanged}
            />

            <div className={styles.sectionActions}>
                <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={onAdd}
                >
                    <i className="fas fa-plus" />
                    Добавить рабочий день
                </button>
            </div>
        </div>
    );
}