// ============================================================
// API для страницы «Мои услуги»
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

// ---------- КАТЕГОРИИ ----------

/**
 * Загружает все категории мастера + услуги без категории.
 * GET /api/categories/
 */
export function loadCategories() {
    return request('/api/categories/', { method: 'GET' });
}

/**
 * Создаёт новую категорию.
 * POST /api/categories/add/
 */
export function addCategory(data) {
    return request('/api/categories/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Редактирует категорию.
 * POST /api/categories/<id>/edit/
 */
export function editCategory(id, data) {
    return request(`/api/categories/${id}/edit/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Удаляет категорию.
 * POST /api/categories/<id>/delete/
 */
export function deleteCategory(id) {
    return request(`/api/categories/${id}/delete/`, { method: 'POST' });
}

// ---------- УСЛУГИ ----------

/**
 * Возвращает одну услугу по ID (для формы редактирования).
 * GET /api/services/<id>/get/
 */
export function getService(id) {
    return request(`/api/services/${id}/get/`, { method: 'GET' });
}

/**
 * Создаёт новую услугу.
 * POST /api/services/add/
 */
export function addService(data) {
    return request('/api/services/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Редактирует услугу.
 * POST /api/services/<id>/edit/
 */
export function editService(id, data) {
    return request(`/api/services/${id}/edit/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Удаляет услугу.
 * POST /api/services/<id>/delete/
 */
export function deleteService(id) {
    return request(`/api/services/${id}/delete/`, { method: 'POST' });
}