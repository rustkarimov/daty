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

export default function PushProvider({ children }) {
    const supported = isPushSupported();
    const iosHint = isIOSWithoutPWA();

    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

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

    // Автопроверка при монтировании
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

    // ---------- Провайдер ----------

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
            }}
        >
            {children}
        </PushContext.Provider>
    );
}