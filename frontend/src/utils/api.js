// frontend/src/utils/api.js
// ============================================================
// Универсальные обёртки над fetch.
// ============================================================

import { getCsrfToken } from './csrf';

/**
 * JSON-запрос с CSRF. Для POST/PUT/DELETE.
 */
export async function request(url, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
            ...(options.headers || {}),
        },
        ...options,
    };

    const response = await fetch(url, config);
    return response.json();
}

/**
 * GET-запрос без CSRF. Бросает ошибку при HTTP != 2xx.
 */
export async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * POST с FormData (multipart/form-data). Content-Type ставит браузер сам.
 */
export async function requestFormData(url, formData) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken(),
        },
        body: formData,
    });
    return response.json();
}