import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePush } from './PushProvider';
import { savePushStatus } from '../../api/push';
import useModal from '../../hooks/useModal';
import styles from './PushPrePrompt.module.css';

const DELAY_MS = 3000;

export default function PushPrePrompt({ pushStatus, onStatusChange }) {
    const { supported, iosHint, loading, busy, subscribe } = usePush();
    const { showAlert } = useModal();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Показываем, только если:
        // - браузер поддерживает Push
        // - это не iOS без PWA
        // - загрузка проверки завершена
        // - статус "unknown" (то есть мастер еще не решил)
        if (loading) return;
        if (!supported || iosHint) return;
        if (pushStatus !== 'unknown') return;

        const timer = setTimeout(() => {
            setVisible(true);
        }, DELAY_MS);

        return () => clearTimeout(timer);
    }, [loading, supported, iosHint, pushStatus]);

    async function handleEnable() {
        try {
            await subscribe();
            await savePushStatus('allowed');
            localStorage.setItem('daty_push_status', 'allowed');
            onStatusChange('allowed');
            setVisible(false);
        } catch (e) {
            showAlert(e.message || 'Не удалось включить уведомления', 'error');
        }
    }

    async function handleDeny() {
        try {
            await savePushStatus('denied');
        } catch (e) {
            console.error(e);
        }
        localStorage.setItem('daty_push_status', 'denied');
        onStatusChange('denied');
        setVisible(false);
    }

    function handleLater() {
        setVisible(false);
    }

    if (!visible) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.backdrop} onClick={handleLater}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-bell" />
                        Уведомления о записях
                    </h5>
                    <button type="button" className={styles.closeBtn} onClick={handleLater}>
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <p>
                        Включить уведомления? Когда клиент запишется — вы сразу узнаете.
                        Даже если приложение закрыто.
                    </p>
                    <p className={styles.hint}>
                        <i className="fas fa-lock" />
                        Мы не отправляем рекламу. Только уведомления о ваших записях.
                    </p>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={handleDeny}
                        disabled={busy}
                    >
                        Нет
                    </button>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={handleLater}
                        disabled={busy}
                    >
                        Позже
                    </button>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={handleEnable}
                        disabled={busy}
                    >
                        {busy ? (
                            <><i className="fas fa-spinner fa-spin" /> Включение...</>
                        ) : (
                            <><i className="fas fa-bell" /> Включить</>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}