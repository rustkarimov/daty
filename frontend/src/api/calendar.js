// Базовые API-функции для календаря

import { getJson } from '../utils/api';

export async function loadCalendar() {
    return getJson('/api/schedule/calendar/');
}

export async function loadCounts() {
    return getJson('/api/bookings/counts/');
}