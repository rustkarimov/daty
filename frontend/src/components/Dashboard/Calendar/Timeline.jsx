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

    // ---- Диапазон шкалы ----
    const { startMin, endMin } = useMemo(() => {
        const workStart = dayData?.extra_start || dayData?.schedule_start || '09:00';
        const workEnd = dayData?.extra_end || dayData?.schedule_end || '18:00';

        let startM = timeToMinutes(workStart);
        let endM = timeToMinutes(workEnd);

        (bookings || []).forEach(b => {
            if (isAway && b.busy_start) {
                startM = Math.min(startM, timeToMinutes(b.busy_start));
            }
            if (isAway && b.busy_end) {
                endM = Math.max(endM, timeToMinutes(b.busy_end));
            }
        });

        // Без округления вниз/вверх
        return { startMin: startM, endMin: endM };
    }, [dayData, bookings, isAway]);

    const totalMinutes = Math.max(endMin - startMin, 60);
    const isMobile = useIsMobile();
    const hourHeight = isMobile ? 64 : 80;
    const pxPerMinute = hourHeight / 60;
    const totalHeight = totalMinutes * pxPerMinute;

    // Метки — только целые часы
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

    // Текущее время
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

    // Пересечения
    const conflicts = useMemo(() => {
        const sorted = [...(bookings || [])].sort(
            (a, b) => timeToMinutes(a.busy_start) - timeToMinutes(b.busy_start)
        );
        const result = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const cur = sorted[i];
            const next = sorted[i + 1];
            const curEnd = timeToMinutes(cur.busy_end);
            const nextStart = timeToMinutes(next.busy_start);
            if (curEnd > nextStart) {
                result.push({ startMin: nextStart, endMin: curEnd });
            }
        }
        return result;
    }, [bookings]);

    // Клик по пустому месту
    function handleEmptyClick(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const rawMinutes = y / pxPerMinute + startMin;
        const W = dayData?.arrival_window_minutes || 0;
        const step = isAway && W > 0 ? W : 30;
        const minutes = Math.round(rawMinutes / step) * step;

        if (breaksInMin.some(b => minutes >= b.start && minutes < b.end)) return;

        if ((bookings || []).some(b => {
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
                    {/* Метки времени и линии сетки */}
                    {hourMarks.map(m => {
                        const top = (m - startMin) * pxPerMinute;
                        return (
                            <React.Fragment key={m}>
                                <div
                                    className={styles.hourLine}
                                    style={{ top: `${top}px` }}
                                />
                                <div
                                    className={styles.hourLabel}
                                    style={{ top: `${top}px` }}
                                >
                                    {minutesToTime(m)}
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* Перерывы */}
                    {breaksInMin.map((b, i) => {
                        const top = Math.max(0, (b.start - startMin) * pxPerMinute);
                        const height = (b.end - b.start) * pxPerMinute;
                        return (
                            <div
                                key={`break-${i}`}
                                className={styles.breakBlock}
                                style={{ top: `${top}px`, height: `${height}px` }}
                            >
                                {height >= 40 && <span>Перерыв</span>}
                            </div>
                        );
                    })}

                    {/* Блоки записей */}
                    {(bookings || []).map(b => (
                        <BookingBlock
                            key={b.id}
                            booking={b}
                            startMin={startMin}
                            pxPerMinute={pxPerMinute}
                            isAway={isAway}
                            isHovered={hoveredId === b.id}
                            onHover={setHoveredId}
                            onEdit={() => onEditBooking(b.id)}
                        />
                    ))}

                    {/* Пересечения */}
                    {conflicts.map((c, i) => {
                        const top = Math.max(0, (c.startMin - startMin) * pxPerMinute);
                        const height = Math.max(3, (c.endMin - c.startMin) * pxPerMinute);
                        return (
                            <div
                                key={`conflict-${i}`}
                                className={styles.conflictZone}
                                style={{ top: `${top}px`, height: `${height}px` }}
                                title="Пересечение дороги"
                            />
                        );
                    })}

                    {/* Линия «сейчас» */}
                    {showNowLine && (
                        <div
                            className={styles.nowLine}
                            style={{ top: `${(nowMin - startMin) * pxPerMinute}px` }}
                        >
                            <span className={styles.nowDot} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Блок записи
// ============================================================

function BookingBlock({ booking, startMin, pxPerMinute, isAway, isHovered, onHover, onEdit }) {
    let busyStart, busyEnd, arrivalStart, serviceEnd;

    if (isAway) {
        busyStart = timeToMinutes(booking.busy_start);
        busyEnd = timeToMinutes(booking.busy_end);
        arrivalStart = timeToMinutes(booking.arrival_start);
        serviceEnd = timeToMinutes(booking.service_end);
    } else {
        busyStart = timeToMinutes(booking.time);
        arrivalStart = busyStart;
        serviceEnd = busyStart + (booking.service_duration || 60);
        busyEnd = serviceEnd;
    }

    const top = (busyStart - startMin) * pxPerMinute;
    
    // Считаем высоты
    let travelBeforeH = (arrivalStart - busyStart) * pxPerMinute;
    let colorZoneH = (serviceEnd - arrivalStart) * pxPerMinute;
    let travelAfterH = (busyEnd - serviceEnd) * pxPerMinute;

    // Минимальные высоты (чтобы влез текст и адрес)
    const minTravelHeight = 24; 
    const minColorHeight = 60; 

    if (travelBeforeH < minTravelHeight) travelBeforeH = minTravelHeight;
    if (travelAfterH > 0 && travelAfterH < minTravelHeight) travelAfterH = minTravelHeight;
    if (colorZoneH < minColorHeight) colorZoneH = minColorHeight;

    const height = travelBeforeH + colorZoneH + travelAfterH;

    const colorClass = booking.status === 'pending' ? styles.pending : styles.confirmed;

    // Время прибытия для первой строки
    const arrivalEnd = timeToMinutes(booking.arrival_end);
    const arrivalTimeStr = arrivalStart < arrivalEnd
        ? `${minutesToTime(arrivalStart)}—${minutesToTime(arrivalEnd)}`
        : minutesToTime(arrivalStart);

    // Адрес с минутами
    const addressLabel = booking.client_address
        ? `${booking.client_address} (${booking.travel_before || 0} мин)`
        : '';

    return (
        <div
            className={`${styles.blockWrapper} ${isHovered ? styles.blockWrapperHovered : ''}`}
            style={{ top: `${top}px`, height: `${height}px` }}
            onMouseEnter={() => onHover(booking.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
            {/* Дорога до */}
            {travelBeforeH > 0 && (
                <div className={styles.travelRow} style={{ height: `${travelBeforeH}px` }}>
                    {addressLabel && (
                        <span className={styles.travelAddress}>
                            <i className="fas fa-map-marker-alt" /> {addressLabel}
                        </span>
                    )}
                </div>
            )}

            {/* Приезд + услуга */}
            <div className={`${styles.serviceRow} ${colorClass}`} style={{ height: `${colorZoneH}px` }}>
                <div className={styles.serviceInner}>
                    <span className={styles.arrivalTime}>
                        {arrivalTimeStr}
                    </span>
                    <span className={styles.clientName}>{booking.client_name}</span>
                    <span className={styles.serviceName}>
                        {booking.category_name ? `${booking.category_name}: ` : ''}
                        {booking.service_name}
                        {booking.service_duration && (
                            <> ({booking.service_duration} мин)</>
                        )}
                    </span>
                </div>
            </div>

            {/* Дорога после */}
            {travelAfterH > 0 && (
                <div className={styles.travelRow} style={{ height: `${travelAfterH}px` }} />
            )}
        </div>
    );
}