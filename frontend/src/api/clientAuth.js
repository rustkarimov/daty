// Авторизация клиента по звонку
import { request } from '../utils/api';

/**
 * Проверка — есть ли записи у клиента с таким телефоном.
 * POST /<identifier>/api/client/check-phone/
 */
export async function checkClientPhone(identifier, phone) {
    return request(`/${identifier}/api/client/check-phone/`, {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
}

/**
 * Запросить звонок для подтверждения.
 * POST /<identifier>/api/client/request-call/
 */
export async function requestClientCall(identifier, phone) {
    return request(`/${identifier}/api/client/request-call/`, {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
}

/**
 * Проверить статус звонка.
 * POST /<identifier>/api/client/check-call/
 */
export async function checkClientCall(identifier, checkId) {
    return request(`/${identifier}/api/client/check-call/`, {
        method: 'POST',
        body: JSON.stringify({ check_id: checkId }),
    });
}