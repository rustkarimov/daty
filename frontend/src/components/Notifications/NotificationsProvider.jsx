import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadNotifications } from './api';

const NotificationsContext = createContext(null);

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) {
        throw new Error('useNotifications must be used within NotificationsProvider');
    }
    return ctx;
}

export default function NotificationsProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const refreshUnreadCount = useCallback(() => {
        loadNotifications(0, 1)
            .then(data => {
                setUnreadCount(data.unread || 0);
            })
            .catch(error => {
                console.error('Ошибка обновления счётчика уведомлений:', error);
            });
    }, []);

    useEffect(() => {
        refreshUnreadCount();
        const interval = setInterval(refreshUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    // Открытие модалки по событию (из SW)
    useEffect(() => {
        function handleOpen() {
            setIsModalOpen(true);
            refreshUnreadCount();
        }

        window.addEventListener('openNotifications', handleOpen);
        return () => {
            window.removeEventListener('openNotifications', handleOpen);
        };
    }, [refreshUnreadCount]);

    function openModal() {
        setIsModalOpen(true);
        refreshUnreadCount();
    }

    function closeModal() {
        setIsModalOpen(false);
        refreshUnreadCount();
    }

    return (
        <NotificationsContext.Provider
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
        </NotificationsContext.Provider>
    );
}