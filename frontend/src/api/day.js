// API-функции для работы с днём

export async function loadDayStatus(date) {
    const r = await fetch(`/api/day-status/?date=${date}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function loadBookingsByDate(date) {
    const r = await fetch(`/api/bookings/by-date/?date=${date}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function makeDayOff(date) {
    const r = await fetch('/api/days-off/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({ date, reason: 'Выходной' }),
    });
    return r.json();
}

export async function makeDayWorking(date) {
    const r = await fetch('/api/extra-days/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            date: date,
            start_time: '09:00',
            end_time: '18:00',
            breaks: [],
        }),
    });
    return r.json();
}

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