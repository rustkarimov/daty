// frontend/src/components/Schedule/ExtraDaysSection.jsx
import React from 'react';
import ExtraDaysList from './ExtraDaysList';
import styles from './SchedulePage.module.css';

export default function ExtraDaysSection({
    futureDays,
    pastDays,
    pastDaysHasMore,
    loading,
    onLoadMorePast,
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
                    Дополнительно работаю
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
                    title="Добавить допдень"
                >
                    <i className="fas fa-plus" />
                </button>
            </div>

            <ExtraDaysList
                futureDays={futureDays}
                pastDays={pastDays}
                pastDaysHasMore={pastDaysHasMore}
                loading={loading}
                onLoadMorePast={onLoadMorePast}
                onDataChanged={onDataChanged}
            />
        </div>
    );
}