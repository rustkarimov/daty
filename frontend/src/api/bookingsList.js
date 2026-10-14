// API для списка записей (для дашборда)

import { request, getJson } from '../utils/api';

export async function loadBookings(page = 1, limit = 3) {
    return getJson(`/api/bookings/?page=${page}&limit=${limit}`);
}

export async function confirmBooking(bookingId) {
    return request(`/api/booking/${bookingId}/confirm/`, {
        method: 'POST',
    });
}

export async function unconfirmBooking(bookingId) {
    return request(`/api/booking/${bookingId}/unconfirm/`, {
        method: 'POST',
    });
}