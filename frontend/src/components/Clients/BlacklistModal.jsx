import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import { addToBlacklist } from '../../api/clients';
import styles from './BlacklistModal.module.css';
import useBodyLock from '../../hooks/useBodyLock';
import { phoneMask } from '../../utils/phoneMask';

export default function BlacklistModal({
    onClose,
    onSaved,
    initialName = '',
    initialPhone = '',
}) {
    useBodyLock();
    const [name, setName] = useState(initialName);
    const [phone, setPhone] = useState(initialPhone);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const { showAlert } = useModal();

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    async function handleSave(e) {
        e.preventDefault();

        const phoneCleaned = phone.replace(/\D/g, '');
        if (phoneCleaned.length !== 11) {
            showAlert('Введите корректный номер телефона', 'warning');
            return;
        }

        setSaving(true);
        try {
            const data = await addToBlacklist({
                name: name.trim(),
                phone: phoneCleaned,
                reason: reason.trim(),
            });

            if (data.success) {
                onSaved();
                onClose();
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-ban" />
                        Добавить в чёрный список
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
                    <form id="blacklist-form" onSubmit={handleSave}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Имя клиента</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Необязательно"
                                autoFocus
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>
                                Телефон <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="tel"
                                className={styles.formInput}
                                value={phone}
                                onChange={e => setPhone(phoneMask(e.target.value))}
                                placeholder="7 999 123-45-67"
                            />
                            <small className={styles.formHint}>
                                Клиент с этим номером не сможет записаться
                            </small>
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Причина блокировки</label>
                            <textarea
                                className={styles.formTextarea}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                rows="3"
                                placeholder="Например: Не пришёл на запись"
                            />
                        </div>
                    </form>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        form="blacklist-form"
                        className={styles.btnPrimary}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                Добавление...
                            </>
                        ) : (
                            'Добавить'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}