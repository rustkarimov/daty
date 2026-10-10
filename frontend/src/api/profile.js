// ============================================================
// API для страницы «Профиль»
// ============================================================

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

async function request(url, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            ...(options.headers || {}),
        },
        ...options,
    };
    const response = await fetch(url, config);
    return response.json();
}

export function updateProfile(data) {
    return request('/api/profile/update/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    return fetch('/api/upload-avatar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: formData,
    }).then(r => r.json());
}