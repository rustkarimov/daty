// frontend/src/components/Schedule/SchedulesSection.jsx
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
            <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
            }}>
                <div className={styles.sectionTitle} style={{ margin: 0 }}>
                    Регулярная работа
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        flexShrink: 0,
                    }}
                    title="Добавить рабочий день"
                >
                    <i className="fas fa-plus" />
                </button>
            </div>

            <SchedulesList
                schedules={schedules}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
                onDataChanged={onDataChanged}
            />
        </div>
    );
}