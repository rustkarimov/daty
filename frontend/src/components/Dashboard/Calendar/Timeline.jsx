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
    onUpdateBooking,
    showAlert = alert,
}) {
    const isDayOff = dayData?.is_day_off;
    const isAway = (bookings?.[0]?.service_mode === 'away') || dayData?.mode === 'away';

    const sortedBookings = useMemo(() => {
        return [...(bookings || [])].sort(
            (a, b) => timeToMinutes(a.arrival_start || a.time) - timeToMinutes(b.arrival_start || b.time)
        );
    }, [bookings]);

    const [localBookings, setLocalBookings] = useState(sortedBookings);
    const [editingTravel, setEditingTravel] = useState(null);

    useEffect(() => {
        setLocalBookings(sortedBookings);
    }, [sortedBookings]);

    const { startMin, endMin } = useMemo(() => {
        const workStart = dayData?.extra_start || dayData?.schedule_start || '09:00';
        const workEnd = dayData?.extra_end || dayData?.schedule_end || '18:00';
        let startM = timeToMinutes(workStart);
        let endM = timeToMinutes(workEnd);
        localBookings.forEach(b => {
            if (isAway && b.busy_start) startM = Math.min(startM, timeToMinutes(b.busy_start));
            if (isAway && b.busy_end) endM = Math.max(endM, timeToMinutes(b.busy_end));
        });
        return { startMin: startM, endMin: endM };
    }, [dayData, localBookings, isAway]);

    const totalMinutes = Math.max(endMin - startMin, 60);
    const isMobile = useIsMobile();
    const hourHeight = isMobile ? 64 : 80;
    const pxPerMinute = hourHeight / 60;
    const totalHeight = totalMinutes * pxPerMinute;

    const hourMarks = [];
    const firstHour = Math.ceil(startMin / 60) * 60;
    for (let m = firstHour; m <= endMin; m += 60) {
        hourMarks.push(m);
    }

    const breaksInMin = (dayData?.breaks || []).map(b => ({
        start: timeToMinutes(b.start),
        end: timeToMinutes(b.end),
    }));

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const isToday = (() => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const t = new Date();
        return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    })();
    const showNowLine = isToday && nowMin >= startMin && nowMin <= endMin;

    function handleSaveTravel(e) {
        e.stopPropagation();
        if (!editingTravel) return;
        
        const { bookingId, type, value } = editingTravel;
        const numValue = parseInt(value, 10);
        
        if (isNaN(numValue) || numValue < 0) {
            setEditingTravel(null);
            return;
        }

        const booking = localBookings.find(b => b.id === bookingId);
        if (!booking) return;

        // Проверка на наложение
        if (type === 'travel_before') {
            const newBusyStart = timeToMinutes(booking.arrival_start) - numValue;
            // Ищем предыдущую запись
            const prevBooking = localBookings
                .filter(b => timeToMinutes(b.arrival_start) < timeToMinutes(booking.arrival_start))
                .sort((a, b) => timeToMinutes(b.arrival_start) - timeToMinutes(a.arrival_start))[0];

            if (prevBooking && newBusyStart < timeToMinutes(prevBooking.service_end)) {
                // Заезжает на предыдущую услугу
                // (здесь можно вызвать showAlert, но так как у нас нет доступа к нему в Timeline, 
                // мы можем просто не сохранять и вернуть ошибку, либо передать showAlert через пропсы)
                alert('Дорога не может начинаться раньше окончания предыдущей услуги.');
                return; 
            }
        }

        if (type === 'travel_after') {
            const newBusyEnd = timeToMinutes(booking.service_end) + numValue;
            // Ищем следующую запись
            const nextBooking = localBookings
                .filter(b => timeToMinutes(b.arrival_start) > timeToMinutes(booking.arrival_start))
                .sort((a, b) => timeToMinutes(a.arrival_start) - timeToMinutes(b.arrival_start))[0];

            if (nextBooking && newBusyEnd > timeToMinutes(nextBooking.arrival_start)) {
                alert('Дорога не может заезжать на следующую запись.');
                return;
            }
        }

        // Если проверки пройдены — сохраняем
        setLocalBookings(prev => prev.map(b => {
            if (b.id !== bookingId) return b;
            const updated = { ...b };
            if (type === 'travel_before') {
                updated.travel_before = numValue;
                updated.busy_start = minutesToTime(timeToMinutes(b.arrival_start) - numValue);
            }
            if (type === 'travel_after') {
                updated.travel_after = numValue;
                updated.busy_end = minutesToTime(timeToMinutes(b.service_end) + numValue);
            }
            return updated;
        }));

        if (onUpdateBooking) {
            onUpdateBooking(bookingId, {
                [type === 'travel_before' ? 'travel_time_before' : 'travel_time_after']: numValue
            });
        }
        setEditingTravel(null);
    }

    function handleCancelTravel(e) {
        e.stopPropagation();
        setEditingTravel(null);
    }

    function handleEmptyClick(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const rawMinutes = y / pxPerMinute + startMin;
        const W = dayData?.arrival_window_minutes || 0;
        const step = isAway && W > 0 ? W : 30;
        const minutes = Math.round(rawMinutes / step) * step;

        if (breaksInMin.some(b => minutes >= b.start && minutes < b.end)) return;
        if (localBookings.some(b => {
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

    const travelBlocks = [];
    if (isAway) {
        localBookings.forEach((b, i) => {
            const arrivalStart = timeToMinutes(b.arrival_start || b.time);
            const serviceEnd = timeToMinutes(b.service_end);
            const busyStart = timeToMinutes(b.busy_start);
            const busyEnd = timeToMinutes(b.busy_end);
            const prev = i > 0 ? localBookings[i - 1] : null;
            const next = i < localBookings.length - 1 ? localBookings[i + 1] : null;

            // Дорога ДО
            const prevServiceEnd = prev ? timeToMinutes(prev.service_end) : null;
            if (!prev || arrivalStart > prevServiceEnd) {
                const start = prev ? prevServiceEnd : busyStart;
                if (arrivalStart > start) {
                    // Если это разрыв между записями, привязываем дорогу к НАЧАЛУ новой записи (arrivalStart)
                    // чтобы не растягивать серую зону на всю паузу
                    const blockStart = prev ? Math.max(start, arrivalStart - (b.travel_before || 0)) : start;
                    
                    if (arrivalStart > blockStart) {
                        travelBlocks.push({
                            startMin: blockStart, endMin: arrivalStart,
                            address: b.client_address, travelTime: b.travel_before,
                            bookingId: b.id, type: 'travel_before',
                        });
                    }
                }
            }

            // Дорога ПОСЛЕ
            const nextArrivalStart = next ? timeToMinutes(next.arrival_start || next.time) : null;
            if (!next || busyEnd < nextArrivalStart) {
                const end = next ? nextArrivalStart : busyEnd;
                if (end > serviceEnd) {
                    // Если разрыв, привязываем к КОНЦУ текущей услуги (serviceEnd)
                    const blockEnd = next ? Math.min(end, serviceEnd + (b.travel_after || 0)) : end;
                    
                    if (blockEnd > serviceEnd) {
                        travelBlocks.push({
                            startMin: serviceEnd, endMin: blockEnd,
                            address: '', travelTime: b.travel_after,
                            bookingId: b.id, type: 'travel_after',
                        });
                    }
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
                    
                    {hourMarks.map(m => (
                        <React.Fragment key={m}>
                            <div className={styles.hourLine} style={{ top: `${(m - startMin) * pxPerMinute}px` }} />
                            <div className={styles.hourLabel} style={{ top: `${(m - startMin) * pxPerMinute}px` }}>
                                {minutesToTime(m)}
                            </div>
                        </React.Fragment>
                    ))}

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

                    {travelBlocks.map((tb, i) => {
                        const top = (tb.startMin - startMin) * pxPerMinute;
                        const height = (tb.endMin - tb.startMin) * pxPerMinute;
                        if (height <= 0) return null;
                        
                        const isEditing = editingTravel?.bookingId === tb.bookingId && editingTravel?.type === tb.type;

                        return (
                            <div 
                                key={`travel-${i}`} 
                                className={`${styles.travelBg} ${isEditing ? styles.travelBgEditing : ''}`} 
                                style={{ top: `${top}px`, height: `${height}px` }}
                            >
                                {isEditing ? (
                                    /* РЕЖИМ РЕДАКТИРОВАНИЯ */
                                    <div className={styles.editRow}>
                                        <span className={styles.travelAddress}>
                                            {tb.address ? `${tb.address} —` : 'Дорога —'}
                                        </span>
                                        
                                        <input 
                                            type="number"
                                            className={styles.editInput}
                                            value={editingTravel.value}
                                            onChange={(e) => setEditingTravel({ ...editingTravel, value: e.target.value })}
                                            autoFocus
                                            min="0"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className={styles.editUnit}>мин</span>
                                        
                                        <div className={styles.editActions}>
                                            <button className={`${styles.iconBtn} ${styles.iconBtnSuccess}`} onClick={handleSaveTravel} title="Сохранить">
                                                <i className="fas fa-check" />
                                            </button>
                                            <button className={`${styles.iconBtn} ${styles.iconBtnSecondary}`} onClick={handleCancelTravel} title="Отмена">
                                                <i className="fas fa-times" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* РЕЖИМ ПРОСМОТРА */
                                    <div className={styles.viewRow}>
                                        <span className={styles.travelAddress}>
                                            <i className="fas fa-map-marker-alt" /> 
                                            {tb.address ? `${tb.address} (${tb.travelTime || 0} мин)` : `${tb.travelTime} мин`}
                                        </span>
                                        <button 
                                            className={styles.inlineEditBtn}
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setEditingTravel({ bookingId: tb.bookingId, type: tb.type, value: tb.travelTime || 0 }); 
                                            }}
                                        >
                                            <i className="fas fa-pen" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {localBookings.map(b => {
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