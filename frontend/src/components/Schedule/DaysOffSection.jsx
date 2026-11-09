// frontend/src/components/Schedule/DaysOffSection.jsx
//
// Секция «Выходные дни»: список + кнопка «Добавить».

import React from 'react';
import DaysOffList from './DaysOffList';
import styles from './SchedulePage.module.css';

export default function DaysOffSection({
    daysOff,
    loading,
    onDataChanged,
    onAdd,
}) {
    return (
        <div className={styles.card}>
            <div className={styles.sectionTitle}>Выходные дни</div>

            <DaysOffList
                daysOff={daysOff}
                loading={loading}
                onDataChanged={onDataChanged}
            />

            <div className={styles.sectionActions}>
                <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={onAdd}
                >
                    <i className="fas fa-plus" />
                    Добавить выходной
                </button>
            </div>
        </div>
    );
}