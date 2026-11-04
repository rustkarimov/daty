import { request, getJson } from '../utils/api';

export async function getVapidPublicKey() {
    return getJson('/api/push/vapid-key/');
}

export async function savePushStatus(status) {
    return request('/api/push/status/', {
        method: 'POST',
        body: JSON.stringify({ status }),
    });
}

export async function saveSubscription(subscription) {
    return request('/api/push/subscribe/', {
        method: 'POST',
        body: JSON.stringify(subscription),
    });
}

export async function removeSubscription(endpoint) {
    return request('/api/push/unsubscribe/', {
        method: 'POST',
        body: JSON.stringify({ endpoint }),
    });
}

export async function checkSubscription(endpoint) {
    return request('/api/push/check/', {
        method: 'POST',
        body: JSON.stringify({ endpoint }),
    });
}