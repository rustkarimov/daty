import React, { useEffect, useRef } from 'react';
import styles from './ConfirmModal.module.css';

export default function ConfirmModal({
    message,
    title = 'Подтверждение',
    confirmText = 'Да',
    cancelText = 'Отмена',
    type = 'warning',
    onConfirm,
    onCancel,
}) {
    const confirmBtnRef = useRef(null);

    useEffect(() => {
        function handleEsc(e) {
            if (e.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    useEffect(() => {
        if (confirmBtnRef.current) confirmBtnRef.current.focus();
    }, []);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    }

    const ICONS = {
        warning: 'fa-exclamation-triangle',
        danger: 'fa-exclamation-circle',
        info: 'fa-question-circle',
    };
    const iconClass = ICONS[type] || ICONS.warning;

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={`${styles.modal} ${styles[type] || ''}`} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className={`fas ${iconClass}`} />
                        {title}
                    </h5>
                </div>

                <div className={styles.body}>
                    {message}
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={styles.btnConfirm}
                        onClick={onConfirm}
                        ref={confirmBtnRef}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}