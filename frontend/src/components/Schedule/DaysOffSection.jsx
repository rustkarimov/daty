// frontend/src/components/Schedule/DaysOffSection.jsx
import React from 'react';
import DaysOffList from './DaysOffList';
import VacationList from './VacationList';
import styles from './SchedulePage.module.css';

export default function DaysOffSection({
    daysOff,
    vacations,
    loading,
    loadingVacations,
    onDataChanged,
    onDataChangedVacations,
    onAdd,
}) {
    return (
        <div className={styles.card}>
            <div className={styles.sectionTitle}>Выходные дни</div>

            {/* Выходные */}
            <DaysOffList
                daysOff={daysOff}
                loading={loading}
                onDataChanged={onDataChanged}
            />

            {/* Отпуска */}
            <div style={{ marginTop: 16 }}>
                <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--gray-700)',
                    marginBottom: 8,
                }}>
                    <i className="fas fa-plane me-1" style={{ color: 'var(--primary)' }} />
                    Отпуск
                </div>
                <VacationList
                    vacations={vacations}
                    loading={loadingVacations}
                    onDataChanged={onDataChangedVacations}
                />
            </div>

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