// ============================================================
// API для чата поддержки
// ============================================================

import { request } from '../../utils/api';

export function loadMessages() {
    return request('/api/support/messages/', { method: 'GET' });
}

export function sendMessage(message) {
    return request('/api/support/send/', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export function getUnreadCount() {
    return request('/api/support/unread/', { method: 'GET' });
}