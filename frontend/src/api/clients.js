// ============================================================
// API для страницы «Статистика клиентов»
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

// ---------- КЛИЕНТЫ ----------

export function loadClients(page = 1, limit = 10) {
    return request(`/api/clients-statistics/?page=${page}&limit=${limit}`, { method: 'GET' });
}

export function searchClients(query) {
    return request(`/api/clients/search/?q=${encodeURIComponent(query)}`, { method: 'GET' });
}

// ---------- ЧЁРНЫЙ СПИСОК ----------

export function loadBlacklist() {
    return request('/api/blacklist/list/', { method: 'GET' });
}

export function addToBlacklist(data) {
    return request('/api/blacklist/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function removeFromBlacklist(clientId) {
    return request(`/api/blacklist/${clientId}/delete/`, { method: 'POST' });
}
