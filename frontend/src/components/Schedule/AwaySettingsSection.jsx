// frontend/src/components/Schedule/AwaySettingsSection.jsx
//
// Секция «Выездной режим»: дорога до/после, интервал прибытия.

import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import { updateAwayTravel } from '../../api/schedule';
import styles from './SchedulePage.module.css';

export default function AwaySettingsSection({
    initialAwayTravelBefore = 0,
    initialAwayTravelAfter = 0,
    initialArrivalWindow = 30,
    onSaved = null,
}) {
    const [awayTravelBefore, setAwayTravelBefore] = useState(initialAwayTravelBefore);
    const [awayTravelAfter, setAwayTravelAfter] = useState(initialAwayTravelAfter);
    const [arrivalWindow, setArrivalWindow] = useState(initialArrivalWindow);
    const [saving, setSaving] = useState(false);

    const { showAlert } = useModal();

    async function handleSave() {
        setSaving(true);
        try {
            const data = await updateAwayTravel({
                away_travel_time_before_default: parseInt(awayTravelBefore) || 0,
                away_travel_time_after_default: parseInt(awayTravelAfter) || 0,
                arrival_window_minutes: parseInt(arrivalWindow) || 0,
            });
            if (data.success) {
                showAlert('Настройки выезда сохранены', 'success');
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
            <div className={styles.sectionTitle}>Выездной режим</div>

            <div className={styles.travelTimeBlock}>
                <div className={styles.travelTimeRow}>
                    <div className={styles.travelTimeField}>
                        <label className={styles.travelTimeLabel}>
                            <i className="fas fa-car me-1" />
                            Время на дорогу до клиента (мин)
                        </label>
                        <input
                            type="number"
                            className={styles.travelTimeInput}
                            min="0"
                            step="5"
                            value={awayTravelBefore}
                            onChange={e => setAwayTravelBefore(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className={styles.travelTimeRow}>
                    <div className={styles.travelTimeField}>
                        <label className={styles.travelTimeLabel}>
                            <i className="fas fa-undo me-1" />
                            Время на дорогу после клиента (мин)
                        </label>
                        <input
                            type="number"
                            className={styles.travelTimeInput}
                            min="0"
                            step="5"
                            value={awayTravelAfter}
                            onChange={e => setAwayTravelAfter(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className={styles.travelTimeRow}>
                    <div className={styles.travelTimeField}>
                        <label className={styles.travelTimeLabel}>
                            <i className="fas fa-clock me-1" />
                            Интервал прибытия (мин)
                        </label>
                        <select
                            className={styles.travelTimeSelect}
                            value={arrivalWindow}
                            onChange={e => setArrivalWindow(e.target.value)}
                        >
                            <option value="0">0 (точное время)</option>
                            <option value="15">15 минут</option>
                            <option value="30">30 минут</option>
                            <option value="45">45 минут</option>
                            <option value="60">60 минут</option>
                            <option value="100">100 минут</option>
                            <option value="120">120 минут</option>
                        </select>
                    </div>
                </div>

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
                        <><i className="fas fa-save" /> Сохранить</>
                    )}
                </button>

                <small className={styles.travelTimeHint}>
                    Дорога и интервал будут автоматически добавляться к каждой записи.
                    Мастер может изменить их в карточке заказа.
                </small>
            </div>
        </div>
    );
}