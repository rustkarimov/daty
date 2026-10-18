import React, { useState } from 'react';
import { updateProfile } from '../../api/profile';
import useModal from '../../hooks/useModal';
import styles from './WorkModeToggle.module.css';

export default function WorkModeToggle({ currentMode }) {
    const [mode, setMode] = useState(currentMode || 'home');
    const [saving, setSaving] = useState(false);
    const { showConfirm, showAlert } = useModal();

    async function handleSwitch(newMode) {
        if (newMode === mode || saving) return;

        const ok = await showConfirm(
            newMode === 'away'
                ? 'Переключиться на выездной режим?\n\nОткроется отдельное расписание, услуги и выходные для выезда.'
                : 'Переключиться на домашний режим?\n\nОткроется домашнее расписание.',
            { type: 'info' }
        );
        if (!ok) return;

        setSaving(true);
        try {
            const data = await updateProfile({ work_mode: newMode });
            if (data.success) {
                setMode(newMode);
                window.location.reload();
            } else {
                showAlert(data.error || 'Ошибка переключения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.card}>
            <div className={styles.label}>Режим работы</div>
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${mode === 'home' ? styles.active : ''}`}
                    onClick={() => handleSwitch('home')}
                    disabled={saving}
                >
                    <i className="fas fa-home me-1" />
                    Дома
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${mode === 'away' ? styles.active : ''}`}
                    onClick={() => handleSwitch('away')}
                    disabled={saving}
                >
                    <i className="fas fa-car me-1" />
                    Выезд
                </button>
            </div>
        </div>
    );
}