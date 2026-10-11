import React from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from './NotificationsProvider';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
    const { unreadCount, openModal } = useNotifications();

    // Найти DOM-узел в шапке
    const target = typeof document !== 'undefined'
        ? document.getElementById('react-notification-bell')
        : null;

    if (!target) return null;

    return createPortal(
        <div className={styles.bell} onClick={openModal}>
            <i className={`fas fa-bell ${styles.icon}`} />
            {unreadCount > 0 && <span className={styles.dot} />}
        </div>,
        target
    );
}