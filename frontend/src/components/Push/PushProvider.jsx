// frontend/src/components/Push/PushProvider.jsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import {
    isPushSupported,
    isIOSWithoutPWA,
    subscribeToPush as apiSubscribe,
    unsubscribeFromPush as apiUnsubscribe,
    checkPushSubscription as apiCheck,
} from '../../utils/pushUtils';

const PushContext = createContext(null);

export function usePush() {
    const ctx = useContext(PushContext);
    if (!ctx) {
        throw new Error('usePush must be used within PushProvider');
    }
    return ctx;
}

// ---- Инициализация pushStatus ----
// Читаем из #react-app (data-push-status), fallback — localStorage.
function readInitialPushStatus() {
    if (typeof document === 'undefined') return 'unknown';
    const el = document.getElementById('react-app');
    const fromData = el?.dataset.pushStatus || 'unknown';

    if (fromData === 'unknown') {
        return localStorage.getItem('daty_push_status') || 'unknown';
    }
    localStorage.setItem('daty_push_status', fromData);
    return fromData;
}

export default function PushProvider({ children }) {
    const supported = isPushSupported();
    const iosHint = isIOSWithoutPWA();

    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    // ---- Единый источник pushStatus ----
    const [pushStatus, setPushStatusState] = useState(readInitialPushStatus);

    // Обёртка: при изменении — сохраняем в localStorage
    const setPushStatus = useCallback((value) => {
        setPushStatusState(value);
        try {
            localStorage.setItem('daty_push_status', value);
        } catch (e) {
            console.warn('Не удалось сохранить push_status в localStorage:', e);
        }
    }, []);

    // ---------- Проверка подписки ----------

    const refresh = useCallback(async () => {
        if (!supported || iosHint) {
            setSubscribed(false);
            setLoading(false);
            return false;
        }

        try {
            const result = await apiCheck();
            setSubscribed(result);
            return result;
        } catch (error) {
            console.error('Ошибка проверки push-подписки:', error);
            setSubscribed(false);
            return false;
        } finally {
            setLoading(false);
        }
    }, [supported, iosHint]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // ---------- Подписка ----------

    const subscribe = useCallback(async () => {
        if (!supported) {
            throw new Error('Браузер не поддерживает push-уведомления');
        }
        if (iosHint) {
            throw new Error('На iPhone нужно сначала установить приложение на домашний экран');
        }

        setBusy(true);
        try {
            await apiSubscribe();
            setSubscribed(true);
            return true;
        } finally {
            setBusy(false);
        }
    }, [supported, iosHint]);

    // ---------- Отписка ----------

    const unsubscribe = useCallback(async () => {
        if (!supported) {
            throw new Error('Браузер не поддерживает push-уведомления');
        }

        setBusy(true);
        try {
            await apiUnsubscribe();
            setSubscribed(false);
            return true;
        } finally {
            setBusy(false);
        }
    }, [supported]);

    return (
        <PushContext.Provider
            value={{
                supported,
                iosHint,
                subscribed,
                loading,
                busy,
                refresh,
                subscribe,
                unsubscribe,
                pushStatus,
                setPushStatus,
            }}
        >
            {children}
        </PushContext.Provider>
    );
}