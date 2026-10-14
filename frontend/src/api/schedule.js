// ============================================================
// API для страницы «Расписание»
// ============================================================

import { request } from '../utils/api';

// ---------- РЕГУЛЯРНОЕ РАСПИСАНИЕ ----------

export function loadSchedules() {
    return request('/api/schedules/', { method: 'GET' });
}

export function addSchedule(data) {
    return request('/api/schedule/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function editSchedule(id, data) {
    return request(`/api/schedule/${id}/edit/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteSchedule(id) {
    return request(`/api/schedule/${id}/delete/`, { method: 'POST' });
}

// ---------- ДОПОЛНИТЕЛЬНЫЕ РАБОЧИЕ ДНИ ----------

export function loadUpcomingExtraDays() {
    return request('/api/extra-days/upcoming/', { method: 'GET' });
}

export function loadPastExtraDays(page = 1, limit = 10) {
    return request(`/api/extra-days/past/?page=${page}&limit=${limit}`, { method: 'GET' });
}

export function addExtraDay(data) {
    return request('/api/extra-days/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteExtraDay(id) {
    return request(`/api/extra-days/${id}/delete/`, { method: 'POST' });
}

// ---------- ВЫХОДНЫЕ ДНИ ----------

export function loadDaysOff() {
    return request('/api/days-off/list/', { method: 'GET' });
}

export function addDayOff(data) {
    return request('/api/days-off/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteDayOff(id) {
    return request(`/api/days-off/${id}/delete/`, { method: 'POST' });
}