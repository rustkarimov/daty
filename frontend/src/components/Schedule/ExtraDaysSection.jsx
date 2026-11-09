// frontend/src/components/Schedule/ExtraDaysSection.jsx
//
// Секция «Дополнительно работаю»: доп. дни + кнопка «Добавить».

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
            <div className={styles.sectionTitle}>Дополнительно работаю</div>

            <ExtraDaysList
                futureDays={futureDays}
                pastDays={pastDays}
                pastDaysHasMore={pastDaysHasMore}
                loading={loading}
                onLoadMorePast={onLoadMorePast}
                onDataChanged={onDataChanged}
            />

            <div className={styles.sectionActions}>
                <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={onAdd}
                >
                    <i className="fas fa-plus" />
                    Добавить допдень
                </button>
            </div>
        </div>
    );
}