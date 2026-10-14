// API-функции для работы с днём

import { request, getJson } from '../utils/api';

export async function loadDayStatus(date) {
    return getJson(`/api/day-status/?date=${date}`);
}

export async function loadBookingsByDate(date) {
    return getJson(`/api/bookings/by-date/?date=${date}`);
}

export async function makeDayOff(date) {
    return request('/api/days-off/add/', {
        method: 'POST',
        body: JSON.stringify({ date, reason: 'Выходной' }),
    });
}

export async function makeDayWorking(date) {
    return request('/api/extra-days/add/', {
        method: 'POST',
        body: JSON.stringify({
            date: date,
            start_time: '09:00',
            end_time: '18:00',
            breaks: [],
        }),
    });
}

export async function deleteBooking(bookingId) {
    return request(`/api/booking/${bookingId}/delete/`, { method: 'POST' });
}

export async function loadBookingForEdit(bookingId) {
    return getJson(`/api/booking/${bookingId}/get/`);
}

export async function updateBooking(bookingId, data) {
    return request(`/api/booking/${bookingId}/update/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}