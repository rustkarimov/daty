import React, { useMemo, useState, useEffect } from 'react';
import styles from './Timeline.module.css';

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const WEEKDAY_NAMES = [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота'
];

function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(m) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatDateRu(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} (${WEEKDAY_NAMES[d.getDay()]})`;
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : true
    );
    useEffect(() => {
        function handle() { setIsMobile(window.innerWidth <= 768); }
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, []);
    return isMobile;
}

export default function Timeline({
    dateStr,
    dayData,
    bookings,
    onEditBooking,
    onEmptyClick,
}) {
    const isDayOff = dayData?.is_day_off;
    const isAway = (bookings?.[0]?.service_mode === 'away') || dayData?.mode === 'away';

    // Сортируем записи по времени начала приезда
    const sortedBookings = useMemo(() => {
        return [...(bookings || [])].sort(
            (a, b) => timeToMinutes(a.arrival_start || a.time) - timeToMinutes(b.arrival_start || b.time)
        );
    }, [bookings]);

    // Диапазон шкалы (от начала работы до конца работы + возможные выезды за пределы)
    const { startMin, endMin } = useMemo(() => {
        const workStart = dayData?.extra_start || dayData?.schedule_start || '09:00';
        const workEnd = dayData?.extra_end || dayData?.schedule_end || '18:00';

        let startM = timeToMinutes(workStart);
        let endM = timeToMinutes(workEnd);

        sortedBookings.forEach(b => {
            if (isAway && b.busy_start) {
                startM = Math.min(startM, timeToMinutes(b.busy_start));
            }
            if (isAway && b.busy_end) {
                endM = Math.max(endM, timeToMinutes(b.busy_end));
            }
        });

        return { startMin: startM, endMin: endM };
    }, [dayData, sortedBookings, isAway]);

    const totalMinutes = Math.max(endMin - startMin, 60);
    const isMobile = useIsMobile();
    const hourHeight = isMobile ? 64 : 80;
    const pxPerMinute = hourHeight / 60;
    const totalHeight = totalMinutes * pxPerMinute;

    // Метки времени (целые часы)
    const hourMarks = [];
    const firstHour = Math.ceil(startMin / 60) * 60;
    for (let m = firstHour; m <= endMin; m += 60) {
        hourMarks.push(m);
    }

    // Перерывы
    const breaksInMin = (dayData?.breaks || []).map(b => ({
        start: timeToMinutes(b.start),
        end: timeToMinutes(b.end),
    }));

    // Текущее время (красная линия)
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const isToday = (() => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const t = new Date();
        return d.getFullYear() === t.getFullYear()
            && d.getMonth() === t.getMonth()
            && d.getDate() === t.getDate();
    })();
    const showNowLine = isToday && nowMin >= startMin && nowMin <= endMin;

    const [hoveredId, setHoveredId] = useState(null);

    // Клик по пустому месту
    function handleEmptyClick(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const rawMinutes = y / pxPerMinute + startMin;
        const W = dayData?.arrival_window_minutes || 0;
        const step = isAway && W > 0 ? W : 30;
        const minutes = Math.round(rawMinutes / step) * step;

        if (breaksInMin.some(b => minutes >= b.start && minutes < b.end)) return;

        if (sortedBookings.some(b => {
            const bs = timeToMinutes(b.busy_start);
            const be = timeToMinutes(b.busy_end);
            return minutes >= bs && minutes < be;
        })) return;

        if (onEmptyClick) onEmptyClick(minutesToTime(minutes));
    }

    if (isDayOff) {
        return (
            <div className={styles.emptyDay}>
                <i className="fas fa-bed" />
                <p>Выходной день</p>
            </div>
        );
    }

    // Рассчитываем серые зоны дорог
    const travelBlocks = [];
    if (isAway) {
        sortedBookings.forEach((b, i) => {
            const arrivalStart = timeToMinutes(b.arrival_start || b.time);
            const serviceEnd = timeToMinutes(b.service_end);
            const busyStart = timeToMinutes(b.busy_start);
            const busyEnd = timeToMinutes(b.busy_end);
            const prev = i > 0 ? sortedBookings[i - 1] : null;
            const next = i < sortedBookings.length - 1 ? sortedBookings[i + 1] : null;

            // Дорога ДО (если это первая запись или есть разрыв)
            const prevServiceEnd = prev ? timeToMinutes(prev.service_end) : null;
            if (!prev || arrivalStart > prevServiceEnd) {
                const start = prev ? prevServiceEnd : busyStart;
                if (arrivalStart > start) {
                    travelBlocks.push({
                        startMin: start,
                        endMin: arrivalStart,
                        address: b.client_address,
                        travelTime: b.travel_before,
                    });
                }
            }

            // Дорога ПОСЛЕ (если это последняя запись или следующая не встык)
            const nextArrivalStart = next ? timeToMinutes(next.arrival_start || next.time) : null;
            if (!next || busyEnd < nextArrivalStart) {
                const end = next ? nextArrivalStart : busyEnd;
                if (end > serviceEnd) {
                    travelBlocks.push({
                        startMin: serviceEnd,
                        endMin: end,
                        address: '', // Назад едем пустые
                        travelTime: b.travel_after,
                    });
                }
            }
        });
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <span className={styles.headerDate}>{formatDateRu(dateStr)}</span>
                <span className={styles.headerHint}>
                    <i className="fas fa-hand-pointer" /> Нажмите на свободное время
                </span>
            </div>

            <div className={styles.canvas} onClick={handleEmptyClick}>
                <div className={styles.grid} style={{ height: `${totalHeight}px` }}>
                    
                    {/* Сетка и метки времени */}
                    {hourMarks.map(m => (
                        <React.Fragment key={m}>
                            <div className={styles.hourLine} style={{ top: `${(m - startMin) * pxPerMinute}px` }} />
                            <div className={styles.hourLabel} style={{ top: `${(m - startMin) * pxPerMinute}px` }}>
                                {minutesToTime(m)}
                            </div>
                        </React.Fragment>
                    ))}

                    {/* Перерывы */}
                    {breaksInMin.map((b, i) => (
                        <div
                            key={`break-${i}`}
                            className={styles.breakBlock}
                            style={{
                                top: `${Math.max(0, (b.start - startMin) * pxPerMinute)}px`,
                                height: `${(b.end - b.start) * pxPerMinute}px`
                            }}
                        >
                            {(b.end - b.start) * pxPerMinute >= 40 && <span>Перерыв</span>}
                        </div>
                    ))}

                    {/* Серые зоны (дороги) */}
                    {travelBlocks.map((tb, i) => {
                        const top = (tb.startMin - startMin) * pxPerMinute;
                        const height = (tb.endMin - tb.startMin) * pxPerMinute;
                        if (height <= 0) return null;
                        
                        const label = tb.address ? `${tb.address} (${tb.travelTime || 0} мин)` : '';

                        return (
                            <div key={`travel-${i}`} className={styles.travelBg} style={{ top: `${top}px`, height: `${height}px` }}>
                                {label && height >= 18 && (
                                    <span className={styles.travelAddress}>
                                        <i className="fas fa-map-marker-alt" /> {label}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {/* Цветные блоки (услуги) */}
                    {sortedBookings.map(b => {
                        const arrivalStart = timeToMinutes(b.arrival_start || b.time);
                        const serviceEnd = timeToMinutes(b.service_end);
                        
                        const top = (arrivalStart - startMin) * pxPerMinute;
                        const height = (serviceEnd - arrivalStart) * pxPerMinute;
                        
                        const isPending = b.status === 'pending';
                        const colorClass = isPending ? styles.pending : styles.confirmed;
                        
                        const arrivalEnd = timeToMinutes(b.arrival_end || b.arrival_start);
                        const arrivalTimeStr = arrivalStart < arrivalEnd
                            ? `${minutesToTime(arrivalStart)}—${minutesToTime(arrivalEnd)}`
                            : minutesToTime(arrivalStart);

                        return (
                            <div
                                key={b.id}
                                className={`${styles.serviceBlock} ${colorClass}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                                onClick={(e) => { e.stopPropagation(); onEditBooking(b.id); }}
                            >
                                <div className={styles.serviceInner}>
                                    <span className={styles.arrivalTime}>{arrivalTimeStr}</span>
                                    <span className={styles.clientName}>{b.client_name}</span>
                                    <span className={styles.serviceName}>
                                        {b.category_name ? `${b.category_name}: ` : ''}{b.service_name} ({b.service_duration} мин)
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Красные зоны (пересечения) */}
                    {sortedBookings.map((cur, i) => {
                        if (i === sortedBookings.length - 1) return null;
                        const next = sortedBookings[i + 1];
                        const curEnd = timeToMinutes(cur.busy_end);
                        const nextStart = timeToMinutes(next.busy_start);
                        
                        if (curEnd > nextStart) {
                            const top = (nextStart - startMin) * pxPerMinute;
                            const height = (curEnd - nextStart) * pxPerMinute;
                            return (
                                <div key={`conflict-${i}`} className={styles.conflictZone} style={{ top: `${top}px`, height: `${height}px` }} />
                            );
                        }
                        return null;
                    })}

                    {/* Текущее время */}
                    {showNowLine && (
                        <div className={styles.nowLine} style={{ top: `${(nowMin - startMin) * pxPerMinute}px` }}>
                            <span className={styles.nowDot} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}