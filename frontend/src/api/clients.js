// ============================================================
// API для страницы «Статистика клиентов»
// ============================================================

import { request } from '../utils/api';

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