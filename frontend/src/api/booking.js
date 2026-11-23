// API-функции для работы с записями

import { request, getJson } from '../utils/api';

export async function loadMasterCategories(masterSlug) {
    return getJson(`/api/master/${masterSlug}/categories/`);
}

export async function loadAvailableDates(masterSlug, totalDuration, page = 1, limit = 15) {
    return getJson(`/api/${masterSlug}/dates/?total_duration=${totalDuration}&page=${page}&limit=${limit}`);
}

export async function loadAvailableSlots(masterSlug, totalDuration, date) {
    return getJson(`/api/${masterSlug}/slots/?total_duration=${totalDuration}&date=${date}`);
}

export async function createMultipleBookings(masterSlug, data) {
    return request(`/api/${masterSlug}/book-multiple/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}