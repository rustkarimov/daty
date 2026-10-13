import React from 'react';
import styles from './StatsGrid.module.css';

export default function StatsGrid({ totalBookings, totalServices, totalClients }) {
    return (
        <div className={styles.grid}>
            <div className={styles.card}>
                <div className={styles.icon}>
                    <i className="fas fa-calendar-check" />
                </div>
                <div className={styles.number}>{totalBookings}</div>
                <div className={styles.label}>Записей</div>
            </div>

            <div className={styles.card}>
                <div className={styles.icon}>
                    <i className="fas fa-cut" />
                </div>
                <div className={styles.number}>{totalServices}</div>
                <div className={styles.label}>Услуг</div>
            </div>

            <div className={styles.card}>
                <div className={styles.icon}>
                    <i className="fas fa-users" />
                </div>
                <div className={styles.number}>{totalClients}</div>
                <div className={styles.label}>Клиентов</div>
            </div>
        </div>
    );
}