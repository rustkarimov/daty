export async function getVapidPublicKey() {
    const r = await fetch('/api/push/vapid-key/');
    return r.json();
}

export async function saveSubscription(subscription) {
    const r = await fetch('/api/push/subscribe/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(subscription),
    });
    return r.json();
}

export async function removeSubscription(endpoint) {
    const r = await fetch('/api/push/unsubscribe/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({ endpoint }),
    });
    return r.json();
}

export async function checkSubscription(endpoint) {
    const r = await fetch('/api/push/check/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({ endpoint }),
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