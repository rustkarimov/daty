import React, { useEffect, useRef } from 'react';
import styles from './AlertModal.module.css';

const ICONS = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
};

const DEFAULT_TITLES = {
    success: 'Готово!',
    error: 'Ошибка',
    warning: 'Внимание',
    info: 'Уведомление',
};

export default function AlertModal({ message, title, type = 'info', onClose }) {
    const okBtnRef = useRef(null);

    useEffect(() => {
        function handleEsc(e) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        // Автофокус на кнопке OK
        if (okBtnRef.current) okBtnRef.current.focus();
    }, []);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    const displayTitle = title || DEFAULT_TITLES[type] || 'Уведомление';
    const iconClass = ICONS[type] || ICONS.info;

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={`${styles.modal} ${styles[type] || ''}`} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className={`fas ${iconClass}`} />
                        {displayTitle}
                    </h5>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    {message}
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={onClose}
                        ref={okBtnRef}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}