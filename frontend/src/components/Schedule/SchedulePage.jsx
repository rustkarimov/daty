import React, { useState, useEffect, useCallback } from 'react';
import SchedulesList from './SchedulesList';
import ExtraDaysList from './ExtraDaysList';
import DaysOffList from './DaysOffList';
import ScheduleModal from './ScheduleModal';
import ExtraDayModal from './ExtraDayModal';
import DayOffModal from './DayOffModal';
import useModal from '../../hooks/useModal';
import {
    loadSchedules,
    loadUpcomingExtraDays,
    loadPastExtraDays,
    loadDaysOff,
} from '../../api/schedule';
import styles from './SchedulePage.module.css';

export default function SchedulePage() {
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
    const [scheduleModal, setScheduleModal] = useState(null);   // { mode: 'add' } | { mode: 'edit', schedule: {...} }
    const [extraDayModal, setExtraDayModal] = useState(false);
    const [dayOffModal, setDayOffModal] = useState(false);

    const { showAlert } = useModal();

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

    // Догрузка прошедших доп. дней
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

    return (
        <div className={styles.page}>
            {/* Заголовок */}
            <div className={styles.pageHeader}>
                <h2>Расписание</h2>
            </div>

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