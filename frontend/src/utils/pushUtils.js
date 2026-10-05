import {
    getVapidPublicKey,
    saveSubscription,
    removeSubscription,
    checkSubscription,
} from '../api/push';

// Утилита для base64 → Uint8Array (для VAPID)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Проверка поддержки push
export function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Проверка: iOS Safari без установки на домашний экран
export function isIOSWithoutPWA() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
    return isIOS && !isStandalone;
}

// Подписка на push
export async function subscribeToPush() {
    if (!isPushSupported()) {
        throw new Error('Браузер не поддерживает push-уведомления');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Разрешение на уведомления отклонено');
    }

    const registration = await navigator.serviceWorker.ready;

    const vapidData = await getVapidPublicKey();
    if (!vapidData.success) {
        throw new Error('Не удалось получить VAPID-ключ');
    }
    const vapidPublicKey = vapidData.data.publicKey;

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const subData = subscription.toJSON();
    const result = await saveSubscription({
        endpoint: subData.endpoint,
        keys: subData.keys,
    });

    if (!result.success) {
        throw new Error(result.error || 'Ошибка сохранения подписки');
    }

    return true;
}

// Отписка
export async function unsubscribeFromPush() {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await removeSubscription(endpoint);
        return true;
    }
    return false;
}

// Проверка: подписан ли пользователь
export async function checkPushSubscription() {
    if (!isPushSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) return false;

        const data = await checkSubscription(subscription.endpoint);
        if (!data.success || !data.data || data.data.exists !== true) {
            // Подписки нет на сервере — удаляем локально
            try {
                await subscription.unsubscribe();
            } catch (e) {
                console.warn('Не удалось удалить старую подписку:', e);
            }
            return false;
        }

        return true;
    } catch (error) {
        console.error('Ошибка проверки подписки:', error);
        return false;
    }
}