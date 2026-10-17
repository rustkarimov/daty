// Управление конкретной записью по токену
import { request, getJson } from '../utils/api';

/**
 * Данные записи + доступные даты.
 * GET /<identifier>/api/booking/<token>/get/
 */
export async function loadClientBooking(identifier, token) {
    return getJson(`/${identifier}/api/booking/${token}/get/`);
}

/**
 * Свободные слоты для изменения записи.
 * GET /<identifier>/api/booking/<token>/slots/?date=...
 */
export async function loadClientSlots(identifier, token, date) {
    return getJson(`/${identifier}/api/booking/${token}/slots/?date=${date}`);
}

/**
 * Изменить запись.
 * POST /<identifier>/api/booking/<token>/update/
 */
export async function updateClientBooking(identifier, token, data) {
    return request(`/${identifier}/api/booking/${token}/update/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Отменить запись.
 * POST /<identifier>/api/booking/<token>/cancel/
 */
export async function cancelClientBooking(identifier, token) {
    return request(`/${identifier}/api/booking/${token}/cancel/`, {
        method: 'POST',
    });
}