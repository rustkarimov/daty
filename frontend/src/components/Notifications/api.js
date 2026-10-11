// ============================================================
// API для уведомлений
// ============================================================

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function request(url, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            ...(options.headers || {}),
        },
        ...options,
    };
    const response = await fetch(url, config);
    return response.json();
}

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