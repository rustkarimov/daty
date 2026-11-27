// frontend/src/utils/api.js
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
    
    // Проверяем, что сервер вернул JSON, а не HTML (например, при 500 ошибке)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        console.error(`[API Error] Ожидался JSON, но сервер вернул ${response.status} ${response.statusText}`);
        // Возвращаем объект с ошибкой в том же формате, который ждет фронтенд
        return { success: false, error: `Ошибка сервера (${response.status}). Попробуйте позже.` };
    }

    return response.json();
}

/**
 * GET-запрос без CSRF.
 */
export async function getJson(url) {
    const response = await fetch(url);
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        console.error(`[API Error] Ожидался JSON, но сервер вернул ${response.status} ${response.statusText} по адресу ${url}`);
        throw new Error(`Ошибка сервера (${response.status})`);
    }
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
}

/**
 * POST с FormData (multipart/form-data).
 */
export async function requestFormData(url, formData) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken(),
        },
        body: formData,
    });
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return { success: false, error: `Ошибка сервера (${response.status})` };
    }

    return response.json();
}