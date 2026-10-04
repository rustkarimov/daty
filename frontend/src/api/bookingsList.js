// API для списка записей (для дашборда)

export async function loadBookings(page = 1, limit = 3) {
    const r = await fetch(`/api/bookings/?page=${page}&limit=${limit}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function confirmBooking(bookingId) {
    const r = await fetch(`/api/booking/${bookingId}/confirm/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
    });
    return r.json();
}

export async function unconfirmBooking(bookingId) {
    const r = await fetch(`/api/booking/${bookingId}/unconfirm/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
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