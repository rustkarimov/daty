import React, { useState, useEffect, useRef } from 'react';
import useModal from '../../hooks/useModal';
import useBodyLock from '../../hooks/useBodyLock';
import { phoneMask } from '../../utils/phoneMask';
import {
    checkClientPhone,
    requestClientCall,
    checkClientCall,
} from '../../api/clientAuth';
import styles from './ClientAuthModal.module.css';

export default function ClientAuthModal({ identifier, onClose }) {
    useBodyLock();
    const { showAlert } = useModal();

    const [step, setStep] = useState('phone'); // 'phone' | 'call'
    const [phone, setPhone] = useState('');
    const [checkId, setCheckId] = useState(null);
    const [callPhone, setCallPhone] = useState('');
    const [callPhonePretty, setCallPhonePretty] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [callStatus, setCallStatus] = useState('');
    const [checkingCall, setCheckingCall] = useState(false);

    const intervalRef = useRef(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    // ---------- Шаг 1: проверка телефона + запрос звонка ----------

    async function handleSubmitPhone(e) {
        e.preventDefault();
        const phoneCleaned = phone.replace(/\D/g, '');
        if (phoneCleaned.length !== 11) {
            showAlert('Введите 11 цифр номера телефона', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const checkData = await checkClientPhone(identifier, phoneCleaned);
            if (!checkData.success) {
                showAlert(checkData.error || 'Записи с таким номером не найдены', 'warning');
                return;
            }

            const callData = await requestClientCall(identifier, phoneCleaned);
            if (!callData.success) {
                showAlert(callData.error || 'Ошибка запроса звонка', 'error');
                return;
            }

            setCheckId(callData.data.check_id);
            setCallPhone(callData.data.call_phone);
            setCallPhonePretty(callData.data.call_phone_pretty);
            setStep('call');

            startCallPolling(callData.data.check_id);
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    function startCallPolling(currentCheckId) {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            checkCall(currentCheckId, true);
        }, 5000);
        setTimeout(() => checkCall(currentCheckId, true), 3000);
    }

    // ---------- Шаг 2: проверка статуса звонка ----------

    async function checkCall(currentCheckId, silent = false) {
        if (!currentCheckId) return;

        if (!silent) setCheckingCall(true);
        try {
            const data = await checkClientCall(identifier, currentCheckId);
            if (!data.success) {
                if (!silent) showAlert(data.error || 'Ошибка проверки', 'error');
                return;
            }

            if (data.data.is_confirmed) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setCallStatus('Подтверждено!');
                setTimeout(() => {
                    window.location.href = data.data.redirect;
                }, 500);
            } else {
                setCallStatus('Ожидаем звонка...');
            }
        } catch (error) {
            console.error('Ошибка проверки звонка:', error);
            if (!silent) showAlert('Ошибка соединения', 'error');
        } finally {
            if (!silent) setCheckingCall(false);
        }
    }

    function handleManualCheck() {
        if (checkId) {
            checkCall(checkId, false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-user-check" />
                        Мои записи
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
                    {step === 'phone' && (
                        <form onSubmit={handleSubmitPhone}>
                            <p className={styles.hint}>
                                Введите номер телефона, который указывали при записи.
                            </p>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Телефон</label>
                                <input
                                    type="tel"
                                    className={styles.formInput}
                                    value={phone}
                                    onChange={e => setPhone(phoneMask(e.target.value))}
                                    placeholder="7 999 123-45-67"
                                    autoFocus
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles.btnPrimary}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin" />
                                        Проверка...
                                    </>
                                ) : (
                                    'Продолжить'
                                )}
                            </button>
                        </form>
                    )}

                    {step === 'call' && (
                        <div className={styles.callStep}>
                            <p className={styles.hint}>Позвоните на номер:</p>
                            <a href={`tel:${callPhone}`} className={styles.callLink}>
                                {callPhonePretty}
                            </a>
                            <p className={styles.callHint}>
                                Вам ответит робот и сбросит звонок.<br />
                                Звонок бесплатный.
                            </p>

                            <div className={styles.polling}>
                                <div className={styles.spinner} />
                                <span>{callStatus || 'Ожидаем звонка...'}</span>
                            </div>

                            <button
                                type="button"
                                className={styles.btnOutline}
                                onClick={handleManualCheck}
                                disabled={checkingCall}
                            >
                                <i className="fas fa-sync" />
                                Проверить статус
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}