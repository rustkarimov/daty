// ============================================================
// API для уведомлений
// ============================================================

import { request } from '../../utils/api';

export function loadNotifications(offset = 0, limit = 10) {
    return request(`/api/notifications/?offset=${offset}&limit=${limit}`, { method: 'GET' });
}

export function markAsRead(notificationId) {
    return request(`/api/notifications/${notificationId}/read/`, { method: 'POST' });
}

export function markAsUnread(notificationId) {
    return request(`/api/notifications/${notificationId}/unread/`, { method: 'POST' });
}

export function markAllRead() {
    return request('/api/notifications/mark-all-read/', { method: 'POST' });
}