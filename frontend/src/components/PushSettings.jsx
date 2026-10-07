import React, { useState, useEffect } from 'react';
import {
    isPushSupported,
    isIOSWithoutPWA,
    subscribeToPush,
    unsubscribeFromPush,
    checkPushSubscription,
} from '../utils/pushUtils';
import styles from './PushSettings.module.css';

export default function PushSettings() {
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const supported = isPushSupported();
    const iosHint = isIOSWithoutPWA();

    useEffect(() => {
        if (!supported || iosHint) {
            setLoading(false);
            return;
        }

        checkPushSubscription()
            .then(result => {
                setSubscribed(result);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [supported, iosHint]);

    async function handleEnable() {
        setBusy(true);
        try {
            await subscribeToPush();
            setSubscribed(true);
        } catch (error) {
            alert(error.message || 'Ошибка подписки');
        } finally {
            setBusy(false);
        }
    }

    async function handleDisable() {
        setBusy(true);
        try {
            await unsubscribeFromPush();
            setSubscribed(false);
        } catch (error) {
            alert(error.message || 'Ошибка отписки');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardBody}>
                <div className={styles.row}>
                    <div>
                        <strong className={styles.title}>
                            <i className="fas fa-bell" />
                            Push-уведомления
                        </strong>
                        <div className={styles.subtitle}>
                            Получать уведомления о новых записях
                        </div>
                    </div>
                    <div>
                        {supported && !iosHint && (
                            <>
                                {subscribed ? (
                                    <button
                                        type="button"
                                        className={styles.btnDisable}
                                        onClick={handleDisable}
                                        disabled={busy || loading}
                                    >
                                        {busy ? 'Отключение...' : 'Отключить'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.btnEnable}
                                        onClick={handleEnable}
                                        disabled={busy || loading}
                                    >
                                        {busy ? 'Включение...' : 'Включить'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Пояснения */}
                <div className={styles.hints}>
                    <div className={styles.hint}>
                        <i className="fas fa-info-circle" />
                        Уведомления приходят, даже если приложение закрыто.
                    </div>
                    <div className={styles.hint}>
                        <i className="fas fa-lock" />
                        Только о ваших записях. Без рекламы.
                    </div>
                    {iosHint && (
                        <div className={styles.hint}>
                            <i className="fas fa-mobile-alt" />
                            <span>
                                <strong>На iPhone:</strong> откройте сайт в Safari → «Поделиться» → «На экран Домой» → включите там.
                            </span>
                        </div>
                    )}
                    {!supported && !iosHint && (
                        <div className={`${styles.hint} ${styles.hintError}`}>
                            <i className="fas fa-exclamation-triangle" />
                            Ваш браузер не поддерживает уведомления.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}