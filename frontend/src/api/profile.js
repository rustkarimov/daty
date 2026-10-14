// ============================================================
// API для страницы «Профиль»
// ============================================================

import { request, requestFormData } from '../utils/api';

export function updateProfile(data) {
    return request('/api/profile/update/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return requestFormData('/api/upload-avatar/', formData);
}