import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePush } from './PushProvider';
import useModal from '../../hooks/useModal';
import styles from './PushPrePrompt.module.css';

const DISMISSED_KEY = 'push_dismissed';
const DELAY_MS = 2000;

export default function PushPrePrompt() {
    const { supported, iosHint, subscribed, loading, busy, subscribe } = usePush();
    const { showAlert } = useModal();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Ждём, пока PushProvider проверит подписку
        if (loading) return;

        // Проверяем базовые условия
        if (!supported) return;
        if (iosHint) return;
        if (subscribed) return;
        if (localStorage.getItem(DISMISSED_KEY) === 'true') return;

        // Показываем с задержкой
        const timer = setTimeout(() => {
            setVisible(true);
        }, DELAY_MS);

        return () => clearTimeout(timer);
    }, [loading, supported, iosHint, subscribed]);

    function handleDismiss() {
        localStorage.setItem(DISMISSED_KEY, 'true');
        setVisible(false);
    }

    async function handleEnable() {
        try {
            await subscribe();
            setVisible(false);
        } catch (error) {
            showAlert(error.message || 'Не удалось подписаться', 'error');
        }
    }

    if (!visible) return null;

    // Портал в body — чтобы модалка была поверх всего
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.backdrop} onClick={handleDismiss}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-bell" />
                        Уведомления о записях
                    </h5>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={handleDismiss}
                        aria-label="Закрыть"
                    >
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
                        className={styles.btnSecondary}
                        onClick={handleDismiss}
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
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                Включение...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-bell" />
                                Включить
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}