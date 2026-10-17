// API для клиента (публичные запросы к мастеру)
import { request, getJson } from '../utils/api';

/**
 * Категории и услуги мастера (для публичной страницы).
 * GET /api/master/<identifier>/categories/
 */
export async function loadMasterCategories(identifier) {
    return getJson(`/api/master/${identifier}/categories/`);
}

/**
 * Доступные даты.
 * GET /api/<identifier>/dates/?total_duration=...
 */
export async function loadAvailableDates(identifier, totalDuration, page = 1, limit = 30) {
    return getJson(
        `/api/${identifier}/dates/?total_duration=${totalDuration}&page=${page}&limit=${limit}`
    );
}

/**
 * Свободные слоты.
 * GET /api/<identifier>/slots/?total_duration=...&date=...
 */
export async function loadAvailableSlots(identifier, totalDuration, date) {
    return getJson(
        `/api/${identifier}/slots/?total_duration=${totalDuration}&date=${date}`
    );
}

/**
 * Создать запись (один клиент, несколько услуг).
 * POST /api/<identifier>/book-multiple/
 */
export async function createBookings(identifier, data) {
    return request(`/api/${identifier}/book-multiple/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}