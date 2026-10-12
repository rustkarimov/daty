import React, { useState, useEffect } from 'react';
import {
    loadNotifications,
    markAsRead,
    markAsUnread,
    markAllRead,
} from './api';
import { useNotifications } from './NotificationsProvider';
import useModal from '../../hooks/useModal';
import styles from './NotificationsModal.module.css';

const TYPE_NAMES = {
    'new_booking': 'Новая запись',
    'cancelled_booking': 'Отмена',
    'changed_booking': 'Изменение',
    'system': 'Системное',
    'promo': 'Акция',
    'warning': 'Важно',
};

const TYPE_BADGE_CLASSES = {
    'new_booking': 'badgeSuccess',
    'cancelled_booking': 'badgeDanger',
    'changed_booking': 'badgeWarning',
    'system': 'badgeSecondary',
    'promo': 'badgeInfo',
    'warning': 'badgeWarning',
};

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];
const WEEKDAY_NAMES = [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота'
];

/**
 * Форматирует ISO-дату `YYYY-MM-DD` в «13 октября (вторник)».
 */
function formatDate(input) {
    if (!input) return '';

    let d = null;

    // ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [y, m, day] = input.split('-').map(Number);
        d = new Date(y, m - 1, day);
    }
    // Русский: DD.MM.YYYY
    else if (/^\d{2}\.\d{2}\.\d{4}$/.test(input)) {
        const [day, m, y] = input.split('.').map(Number);
        d = new Date(y, m - 1, day);
    }
    // Что-то другое — вернуть как есть
    else {
        return input;
    }

    // Проверяем, что дата валидна
    if (isNaN(d.getTime())) {
        return input;
    }

    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} (${WEEKDAY_NAMES[d.getDay()]})`;
}

const OFFSET_STEP = 10;

export default function NotificationsModal() {
    const { closeModal, refreshUnreadCount, setUnreadCount } = useNotifications();
    const { showAlert } = useModal();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setLocalUnread] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [openIds, setOpenIds] = useState(new Set());

    // ---- Загрузка ----

    useEffect(() => {
        setLoading(true);
        loadNotifications(0, OFFSET_STEP)
            .then(data => {
                setNotifications(data.notifications || []);
                setLocalUnread(data.unread || 0);
                setHasMore(!!data.has_more);
                setOffset((data.notifications || []).length);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки уведомлений:', error);
                setLoading(false);
                showAlert('Не удалось загрузить уведомления', 'error');
            });
    }, [showAlert]);

    function syncUnread(newCount) {
        setLocalUnread(newCount);
        setUnreadCount(newCount);
    }

    async function handleRead(id) {
        try {
            const data = await markAsRead(id);
            if (data.success) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                );
                syncUnread(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    async function handleUnread(id) {
        try {
            const data = await markAsUnread(id);
            if (data.success) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: false } : n)
                );
                syncUnread(unreadCount + 1);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    function toggleRead(n) {
        if (n.is_read) {
            handleUnread(n.id);
        } else {
            handleRead(n.id);
        }
    }

    async function handleMarkAllRead() {
        try {
            const data = await markAllRead();
            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                syncUnread(0);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    function toggleOpen(n) {
        const newSet = new Set(openIds);
        if (newSet.has(n.id)) {
            newSet.delete(n.id);
        } else {
            newSet.add(n.id);
            if (!n.is_read) {
                handleRead(n.id);
            }
        }
        setOpenIds(newSet);
    }

    async function handleLoadMore() {
        setLoadingMore(true);
        try {
            const data = await loadNotifications(offset, OFFSET_STEP);
            setNotifications(prev => [...prev, ...(data.notifications || [])]);
            setHasMore(!!data.has_more);
            setOffset(offset + (data.notifications || []).length);
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoadingMore(false);
        }
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            closeModal();
            refreshUnreadCount();
        }
    }

    /**
     * Парсит сообщение уведомления.
     * Формат:
     *   📅 2026-10-13
     *   ⏰ 10:00|Маникюр: Классический
     *   ⏰ 11:30|Педикюр: Классический
     */
    function renderMessage(message) {
        const lines = message.split('\n').filter(line => line.trim() !== '');
        const result = [];

        lines.forEach((line, i) => {
            // ---- Дата (📅) ----
            if (line.startsWith('📅')) {
                const raw = line.slice(1).trim();
                const prefixMatch = raw.match(/^(Было|Стало):\s*/);
                let prefix = null;
                let rest = raw;
                if (prefixMatch) {
                    prefix = prefixMatch[1];
                    rest = raw.slice(prefixMatch[0].length);
                }

                const parts = rest.split(/\s+/);
                const rawDate = parts[0] || '';
                const time = parts[1] || '';

                let dateFormatted = rawDate;
                if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                    dateFormatted = formatDate(rawDate);
                } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(rawDate)) {
                    dateFormatted = formatDate(rawDate);
                }

                result.push(
                    <div key={`date-${i}`} className={styles.messageRow}>
                        <div className={styles.messageRowTop}>
                            <span className={styles.messageDate}>
                                {prefix ? `${prefix} ` : ''}
                                {dateFormatted}
                                {time ? ` ${time}` : ''}
                            </span>
                        </div>
                    </div>
                );
                return;
            }

            // ---- Время + услуга (⏰) ----
            if (line.startsWith('⏰')) {
                const raw = line.slice(1).trim();
                const [time, serviceName] = raw.split('|').map(s => s.trim());

                let category = '';
                let service = serviceName || '';
                if (serviceName && serviceName.includes(':')) {
                    const parts = serviceName.split(':');
                    category = parts[0].trim();
                    service = parts.slice(1).join(':').trim();
                }

                result.push(
                    <div key={`time-${i}`} className={styles.messageRow}>
                        {time && (
                            <div className={styles.messageRowTop}>
                                <span className={styles.messageTimeOnly}>{time}</span>
                            </div>
                        )}
                        {(category || service) && (
                            <div className={styles.messageService}>
                                {category ? (
                                    <><span className={styles.messageCategory}>{category}:</span> {service}</>
                                ) : (
                                    service
                                )}
                            </div>
                        )}
                    </div>
                );
                return;
            }

            // ---- Информация (🕐) ----
            if (line.startsWith('🕐')) {
                result.push(
                    <div key={`info-${i}`} className={styles.messageInfo}>
                        {line.slice(1).trim()}
                    </div>
                );
                return;
            }

            // ---- Прочие строки ----
            result.push(
                <div key={`text-${i}`} className={styles.messageInfo}>
                    {line}
                </div>
            );
        });

        return result;
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-bell" />
                        Уведомления
                    </h5>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() => {
                            closeModal();
                            refreshUnreadCount();
                        }}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.headerActions}>
                    <span className={styles.unreadText}>
                        {unreadCount} непрочитанных
                    </span>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className={styles.btnMarkAll}
                            onClick={handleMarkAllRead}
                        >
                            <i className="fas fa-check-double" />
                            Прочитать все
                        </button>
                    )}
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className="fas fa-bell-slash" />
                            <p>У вас пока нет уведомлений</p>
                        </div>
                    ) : (
                        <>
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`${styles.item} ${n.is_read ? styles.itemRead : styles.itemUnread}`}
                                >
                                    <div className={styles.itemMain}>
                                        <div
                                            className={styles.itemClickable}
                                            onClick={() => toggleOpen(n)}
                                        >
                                            <div className={styles.itemTitle}>
                                                <span className={styles[`badge_${TYPE_BADGE_CLASSES[n.type] || 'badgeSecondary'}`]}>
                                                    {TYPE_NAMES[n.type] || n.type}
                                                </span>
                                                <strong>{n.title}</strong>
                                            </div>
                                            {openIds.has(n.id) && (
                                                <div className={styles.itemMessage}>
                                                    {renderMessage(n.message)}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className={`${styles.toggleReadBtn} ${n.is_read ? styles.toggleReadRead : styles.toggleReadUnread}`}
                                            onClick={() => toggleRead(n)}
                                            title={n.is_read ? 'Отметить непрочитанным' : 'Отметить прочитанным'}
                                        >
                                            <i className={`fas ${n.is_read ? 'fa-envelope-open' : 'fa-envelope'}`} />
                                        </button>
                                    </div>
                                    <div className={styles.itemDate}>{n.created_at}</div>
                                </div>
                            ))}

                            {hasMore && (
                                <div className={styles.loadMoreWrapper}>
                                    <button
                                        type="button"
                                        className={styles.btnLoadMore}
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin" />
                                                Загрузка...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-chevron-down" />
                                                Загрузить ещё
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}