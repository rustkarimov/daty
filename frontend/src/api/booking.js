// API-функции для работы с записями

export async function loadMasterCategories(masterSlug) {
    const r = await fetch(`/api/master/${masterSlug}/categories/`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function loadAvailableDates(masterSlug, totalDuration) {
    const r = await fetch(`/api/${masterSlug}/dates/?total_duration=${totalDuration}&limit=60`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function loadAvailableSlots(masterSlug, totalDuration, date) {
    const r = await fetch(`/api/${masterSlug}/slots/?total_duration=${totalDuration}&date=${date}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function createMultipleBookings(masterSlug, data) {
    const r = await fetch(`/api/${masterSlug}/book-multiple/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(data),
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