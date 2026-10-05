import React, { useState, useEffect } from 'react';
import {
    isPushSupported,
    isIOSWithoutPWA,
    subscribeToPush,
    unsubscribeFromPush,
    checkPushSubscription,
} from '../utils/pushUtils';

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
        <div className="card mb-4">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                        <strong style={{ fontSize: '0.95rem' }}>
                            <i className="fas fa-bell me-2" style={{ color: 'var(--primary)' }} />
                            Push-уведомления
                        </strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                            Получать уведомления о новых записях
                        </div>
                    </div>
                    <div>
                        {supported && !iosHint && (
                            <>
                                {subscribed ? (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={handleDisable}
                                        disabled={busy || loading}
                                    >
                                        {busy ? 'Отключение...' : 'Отключить'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-pink"
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
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--gray-200)', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    <div style={{ marginBottom: '4px' }}>
                        <i className="fas fa-info-circle me-1" style={{ color: 'var(--primary)' }} />
                        Уведомления приходят, даже если приложение закрыто.
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                        <i className="fas fa-lock me-1" style={{ color: 'var(--primary)' }} />
                        Только о ваших записях. Без рекламы.
                    </div>
                    {iosHint && (
                        <div>
                            <i className="fas fa-mobile-alt me-1" style={{ color: 'var(--primary)' }} />
                            <strong>На iPhone:</strong> откройте сайт в Safari → «Поделиться» → «На экран Домой» → включите там.
                        </div>
                    )}
                    {!supported && !iosHint && (
                        <div style={{ color: '#dc2626' }}>
                            <i className="fas fa-exclamation-triangle me-1" />
                            Ваш браузер не поддерживает уведомления.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}