// Базовые API-функции для календаря

export async function loadCalendar() {
    const r = await fetch('/api/schedule/calendar/');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function loadCounts() {
    const r = await fetch('/api/bookings/counts/');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}