// ============================================================
// API для страницы «Мои услуги»
// ============================================================

import { request } from '../utils/api';

// ---------- КАТЕГОРИИ ----------

export function loadCategories() {
    return request('/api/categories/', { method: 'GET' });
}

export function addCategory(data) {
    return request('/api/categories/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function editCategory(id, data) {
    return request(`/api/categories/${id}/edit/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteCategory(id) {
    return request(`/api/categories/${id}/delete/`, { method: 'POST' });
}

// ---------- УСЛУГИ ----------

export function getService(id) {
    return request(`/api/services/${id}/get/`, { method: 'GET' });
}

export function addService(data) {
    return request('/api/services/add/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function editService(id, data) {
    return request(`/api/services/${id}/edit/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteService(id) {
    return request(`/api/services/${id}/delete/`, { method: 'POST' });
}