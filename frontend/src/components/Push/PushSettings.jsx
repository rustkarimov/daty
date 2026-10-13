import React from 'react';
import { usePush } from './PushProvider';
import useModal from '../../hooks/useModal';
import styles from './PushSettings.module.css';

export default function PushSettings() {
    const { supported, iosHint, subscribed, loading, busy, subscribe, unsubscribe } = usePush();
    const { showAlert } = useModal();

    async function handleEnable() {
        try {
            await subscribe();
            showAlert('Push-уведомления включены', 'success');
        } catch (error) {
            showAlert(error.message || 'Не удалось подписаться', 'error');
        }
    }

    async function handleDisable() {
        try {
            await unsubscribe();
            showAlert('Push-уведомления отключены', 'success');
        } catch (error) {
            showAlert(error.message || 'Не удалось отписаться', 'error');
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