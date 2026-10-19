import React, { useState, useEffect, useCallback } from 'react';
import SchedulesList from './SchedulesList';
import ExtraDaysList from './ExtraDaysList';
import DaysOffList from './DaysOffList';
import ScheduleModal from './ScheduleModal';
import ExtraDayModal from './ExtraDayModal';
import DayOffModal from './DayOffModal';
import useModal from '../../hooks/useModal';
import { updateAwayTravel } from '../../api/schedule';
import {
    loadSchedules,
    loadUpcomingExtraDays,
    loadPastExtraDays,
    loadDaysOff,
} from '../../api/schedule';
import styles from './SchedulePage.module.css';

export default function SchedulePage({
    masterMode = 'home',
    initialAwayTravelBefore = 0,
}) {
    // Данные
    const [schedules, setSchedules] = useState([]);
    const [futureExtraDays, setFutureExtraDays] = useState([]);
    const [pastExtraDays, setPastExtraDays] = useState([]);
    const [pastDaysHasMore, setPastDaysHasMore] = useState(false);
    const [pastDaysPage, setPastDaysPage] = useState(1);
    const [daysOff, setDaysOff] = useState([]);

    // Загрузка
    const [loadingSchedules, setLoadingSchedules] = useState(true);
    const [loadingExtra, setLoadingExtra] = useState(true);
    const [loadingDaysOff, setLoadingDaysOff] = useState(true);

    // Модалки
    const [scheduleModal, setScheduleModal] = useState(null);
    const [extraDayModal, setExtraDayModal] = useState(false);
    const [dayOffModal, setDayOffModal] = useState(false);

    // Время на дорогу (away)
    const [awayTravelBefore, setAwayTravelBefore] = useState(initialAwayTravelBefore);
    const [savingTravelTime, setSavingTravelTime] = useState(false);

    const { showAlert } = useModal();
    const isAway = masterMode === 'away';

    // ---------- Загрузка данных ----------

    const reloadSchedules = useCallback(() => {
        setLoadingSchedules(true);
        loadSchedules()
            .then(data => {
                setSchedules(data.schedules || []);
                setLoadingSchedules(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки расписаний:', error);
                setLoadingSchedules(false);
                showAlert('Не удалось загрузить расписания', 'error');
            });
    }, [showAlert]);

    const reloadExtraDays = useCallback(() => {
        setLoadingExtra(true);
        Promise.all([loadUpcomingExtraDays(), loadPastExtraDays(1, 10)])
            .then(([upcoming, past]) => {
                setFutureExtraDays(upcoming.future_days || []);
                setPastExtraDays(past.past_days || []);
                setPastDaysHasMore(past.has_more);
                setPastDaysPage(1);
                setLoadingExtra(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки доп. дней:', error);
                setLoadingExtra(false);
            });
    }, []);

    const reloadDaysOff = useCallback(() => {
        setLoadingDaysOff(true);
        loadDaysOff()
            .then(data => {
                setDaysOff(data.days_off || []);
                setLoadingDaysOff(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки выходных:', error);
                setLoadingDaysOff(false);
            });
    }, []);

    useEffect(() => {
        reloadSchedules();
        reloadExtraDays();
        reloadDaysOff();
    }, [reloadSchedules, reloadExtraDays, reloadDaysOff]);

    function loadMorePastDays() {
        const nextPage = pastDaysPage + 1;
        loadPastExtraDays(nextPage, 10)
            .then(data => {
                setPastExtraDays(prev => [...prev, ...(data.past_days || [])]);
                setPastDaysHasMore(data.has_more);
                setPastDaysPage(nextPage);
            })
            .catch(error => {
                console.error('Ошибка догрузки прошедших дней:', error);
            });
    }

    // ---------- Сохранение времени на дорогу ----------

    async function handleSaveTravelTime() {
        setSavingTravelTime(true);
        try {
            const data = await updateAwayTravel({
                away_travel_time_before_default: parseInt(awayTravelBefore) || 0,
            });
            if (data.success) {
                showAlert('Время на дорогу сохранено', 'success');
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSavingTravelTime(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <h2>Расписание</h2>
            </div>

            {/* Блок «Время на дорогу» — только для away */}
            {isAway && (
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
                            <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={handleSaveTravelTime}
                                disabled={savingTravelTime}
                            >
                                {savingTravelTime ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin" />
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save" />
                                        Сохранить
                                    </>
                                )}
                            </button>
                        </div>
                        <small className={styles.travelTimeHint}>
                            Это время будет автоматически добавляться к каждой выездной записи.
                            Мастер может изменить его в карточке заказа.
                        </small>
                    </div>
                </div>
            )}

            {/* Секция 1: Регулярная работа */}
            <div className={styles.card}>
                <div className={styles.sectionTitle}>Регулярная работа</div>

                <SchedulesList
                    schedules={schedules}
                    loading={loadingSchedules}
                    onEdit={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
                    onDelete={() => reloadSchedules()}
                    onDataChanged={reloadSchedules}
                />

                <div className={styles.sectionActions}>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => setScheduleModal({ mode: 'add' })}
                    >
                        <i className="fas fa-plus" />
                        Добавить рабочий день
                    </button>
                </div>
            </div>

            {/* Секция 2: Дополнительно работаю */}
            <div className={styles.card}>
                <div className={styles.sectionTitle}>Дополнительно работаю</div>

                <ExtraDaysList
                    futureDays={futureExtraDays}
                    pastDays={pastExtraDays}
                    pastDaysHasMore={pastDaysHasMore}
                    loading={loadingExtra}
                    onLoadMorePast={loadMorePastDays}
                    onDataChanged={reloadExtraDays}
                />

                <div className={styles.sectionActions}>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => setExtraDayModal(true)}
                    >
                        <i className="fas fa-plus" />
                        Добавить допдень
                    </button>
                </div>
            </div>

            {/* Секция 3: Выходные дни */}
            <div className={styles.card}>
                <div className={styles.sectionTitle}>Выходные дни</div>

                <DaysOffList
                    daysOff={daysOff}
                    loading={loadingDaysOff}
                    onDataChanged={reloadDaysOff}
                />

                <div className={styles.sectionActions}>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => setDayOffModal(true)}
                    >
                        <i className="fas fa-plus" />
                        Добавить выходной
                    </button>
                </div>
            </div>

            {/* Модалки */}
            {scheduleModal && (
                <ScheduleModal
                    mode={scheduleModal.mode}
                    schedule={scheduleModal.schedule}
                    onClose={() => setScheduleModal(null)}
                    onSaved={reloadSchedules}
                />
            )}

            {extraDayModal && (
                <ExtraDayModal
                    schedules={schedules}
                    onClose={() => setExtraDayModal(false)}
                    onSaved={reloadExtraDays}
                />
            )}

            {dayOffModal && (
                <DayOffModal
                    onClose={() => setDayOffModal(false)}
                    onSaved={reloadDaysOff}
                />
            )}
        </div>
    );
}