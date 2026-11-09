// frontend/src/components/Schedule/GeneralSettingsSection.jsx
//
// Секция «Общие настройки»: лид-тайм (для всех) + буфер (только дома).

import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import { updateGeneralSettings } from '../../api/schedule';
import styles from './SchedulePage.module.css';

export default function GeneralSettingsSection({
    isAway,
    initialMinLeadTime = 0,
    initialHomeBuffer = 0,
    onSaved = null,
}) {
    const [minLeadTime, setMinLeadTime] = useState(initialMinLeadTime);
    const [homeBuffer, setHomeBuffer] = useState(initialHomeBuffer);
    const [saving, setSaving] = useState(false);

    const { showAlert } = useModal();

    async function handleSave() {
        setSaving(true);
        try {
            const data = await updateGeneralSettings({
                min_booking_lead_time: parseInt(minLeadTime) || 0,
                home_buffer_between_bookings: parseInt(homeBuffer) || 0,
            });
            if (data.success) {
                showAlert('Настройки сохранены', 'success');
                if (onSaved) onSaved();
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
        <div className={styles.card}>
            <div className={styles.sectionTitle}>Общие настройки</div>

            <div className={styles.travelTimeBlock}>
                <div className={styles.travelTimeRow}>
                    <div className={styles.travelTimeField}>
                        <label className={styles.travelTimeLabel}>
                            <i className="fas fa-clock me-1" />
                            Не принимать записи за (часов)
                        </label>
                        <input
                            type="number"
                            className={styles.travelTimeInput}
                            min="0"
                            value={minLeadTime}
                            onChange={e => setMinLeadTime(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Буфер показываем только для дома */}
                {!isAway && (
                    <div className={styles.travelTimeRow}>
                        <div className={styles.travelTimeField}>
                            <label className={styles.travelTimeLabel}>
                                <i className="fas fa-coffee me-1" />
                                Буфер между записями (мин)
                            </label>
                            <input
                                type="number"
                                className={styles.travelTimeInput}
                                min="0"
                                step="5"
                                value={homeBuffer}
                                onChange={e => setHomeBuffer(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: '12px' }}
                >
                    {saving ? (
                        <><i className="fas fa-spinner fa-spin" /> Сохранение...</>
                    ) : (
                        <><i className="fas fa-save" /> Сохранить настройки</>
                    )}
                </button>
            </div>
        </div>
    );
}