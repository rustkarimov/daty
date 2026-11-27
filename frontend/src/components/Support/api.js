// ============================================================
// API для чата поддержки
// ============================================================

import { request, getJson, requestFormData } from '../../utils/api';

export function loadMessages() {
    return request('/api/support/messages/', { method: 'GET' });
}

export function sendMessage(message, imageFile) {
    const formData = new FormData();
    formData.append('message', message);
    if (imageFile) {
        formData.append('image', imageFile);
    }
    // Используем requestFormData, которую мы сделали в прошлой задаче
    return requestFormData('/api/support/send/', formData);
}

export function getUnreadCount() {
    return request('/api/support/unread/', { method: 'GET' });
}

export function deleteMessage(messageId) {
    return request(`/api/support/messages/${messageId}/delete/`, {
        method: 'POST',
    });
}