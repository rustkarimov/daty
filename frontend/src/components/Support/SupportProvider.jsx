import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from './api';

const SupportContext = createContext(null);

export function useSupport() {
    const ctx = useContext(SupportContext);
    if (!ctx) {
        throw new Error('useSupport must be used within SupportProvider');
    }
    return ctx;
}

export default function SupportProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const refreshUnreadCount = useCallback(() => {
        getUnreadCount()
            .then(data => {
                setUnreadCount(data.unread_count || 0);
            })
            .catch(error => {
                console.error('Ошибка обновления счётчика поддержки:', error);
            });
    }, []);

    // При монтировании + каждые 60 секунд
    useEffect(() => {
        refreshUnreadCount();
        const interval = setInterval(refreshUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    function openModal() {
        setIsModalOpen(true);
        // Отмечаем прочитанными при открытии — сервер сам это сделает
        // при загрузке сообщений
    }

    function closeModal() {
        setIsModalOpen(false);
        refreshUnreadCount();
    }

    return (
        <SupportContext.Provider
            value={{
                unreadCount,
                isModalOpen,
                openModal,
                closeModal,
                refreshUnreadCount,
                setUnreadCount,
            }}
        >
            {children}
        </SupportContext.Provider>
    );
}