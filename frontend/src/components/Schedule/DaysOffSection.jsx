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
            <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
            }}>
                <div className={styles.sectionTitle} style={{ margin: 0 }}>
                    Выходные дни
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
                    title="Добавить выходной"
                >
                    <i className="fas fa-plus" />
                </button>
            </div>

            <DaysOffList
                daysOff={daysOff}
                loading={loading}
                onDataChanged={onDataChanged}
            />

            <div style={{ marginTop: 16 }}>
                <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--gray-700)',
                    marginBottom: 8,
                }}>
                    <i className="fas fa-plane me-1" style={{ color: 'var(--primary)' }} />
                    Отпуска
                </div>
                <VacationList
                    vacations={vacations}
                    loading={loadingVacations}
                    onDataChanged={onDataChangedVacations}
                />
            </div>
        </div>
    );
}