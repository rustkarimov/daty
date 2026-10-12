// ============================================================
// API для чата поддержки
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