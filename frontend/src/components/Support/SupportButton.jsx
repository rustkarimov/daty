import React from 'react';
import { createPortal } from 'react-dom';
import { useSupport } from './SupportProvider';
import styles from './SupportButton.module.css';

export default function SupportButton() {
    const { unreadCount, openModal } = useSupport();

    // Найти DOM-узел в шапке
    const target = typeof document !== 'undefined'
        ? document.getElementById('react-support-button')
        : null;

    if (!target) return null;

    return createPortal(
        <div className={styles.button} onClick={openModal}>
            <i className={`fas fa-comment-dots ${styles.icon}`} />
            <span className={styles.text}>Поддержка</span>
            {unreadCount > 0 && <span className={styles.dot} />}
        </div>,
        target
    );
}