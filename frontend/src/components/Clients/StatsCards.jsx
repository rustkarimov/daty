import React from 'react';
import styles from './StatsCards.module.css';

export default function StatsCards({ totalClients, totalBookings, avgVisits }) {
    return (
        <div className={styles.grid}>
            <div className={styles.card}>
                <div className={styles.icon}>
                    <i className="fas fa-users" />
                </div>
                <div className={styles.number}>{totalClients}</div>
                <div className={styles.label}>Всего клиентов</div>
            </div>

            <div className={styles.card}>
                <div className={styles.icon}>
                    <i className="fas fa-calendar-check" />
                </div>
                <div className={styles.number}>{totalBookings}</div>
                <div className={styles.label}>Всего записей</div>
            </div>

            <div className={styles.card}>
                <div className={styles.icon}>
                    <i className="fas fa-user-clock" />
                </div>
                <div className={styles.number}>{avgVisits}</div>
                <div className={styles.label}>Среднее визитов на клиента</div>
            </div>
        </div>
    );
}