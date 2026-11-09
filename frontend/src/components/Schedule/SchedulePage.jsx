// frontend/src/components/Schedule/SchedulePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ScheduleModal from './ScheduleModal';
import ExtraDayModal from './ExtraDayModal';
import DayOffModal from './DayOffModal';
import GeneralSettingsSection from './GeneralSettingsSection';
import AwaySettingsSection from './AwaySettingsSection';
import SchedulesSection from './SchedulesSection';
import ExtraDaysSection from './ExtraDaysSection';
import DaysOffSection from './DaysOffSection';
import useModal from '../../hooks/useModal';
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
    initialAwayTravelAfter = 0,
    initialArrivalWindow = 30,
    initialMinLeadTime = 0,
    initialHomeBuffer = 0,
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

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <h2>Расписание</h2>
            </div>

            {/* Секция 1: Общие настройки (лид-тайм + буфер для дома) */}
            <GeneralSettingsSection
                isAway={isAway}
                initialMinLeadTime={initialMinLeadTime}
                initialHomeBuffer={initialHomeBuffer}
            />

            {/* Секция 2: Выездной режим (только away) */}
            {isAway && (
                <AwaySettingsSection
                    initialAwayTravelBefore={initialAwayTravelBefore}
                    initialAwayTravelAfter={initialAwayTravelAfter}
                    initialArrivalWindow={initialArrivalWindow}
                />
            )}

            {/* Секция 3: Регулярная работа */}
            <SchedulesSection
                schedules={schedules}
                loading={loadingSchedules}
                onEdit={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
                onDelete={() => reloadSchedules()}
                onDataChanged={reloadSchedules}
                onAdd={() => setScheduleModal({ mode: 'add' })}
            />

            {/* Секция 4: Дополнительно работаю */}
            <ExtraDaysSection
                futureDays={futureExtraDays}
                pastDays={pastExtraDays}
                pastDaysHasMore={pastDaysHasMore}
                loading={loadingExtra}
                onLoadMorePast={loadMorePastDays}
                onDataChanged={reloadExtraDays}
                onAdd={() => setExtraDayModal(true)}
            />

            {/* Секция 5: Выходные дни */}
            <DaysOffSection
                daysOff={daysOff}
                loading={loadingDaysOff}
                onDataChanged={reloadDaysOff}
                onAdd={() => setDayOffModal(true)}
            />

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