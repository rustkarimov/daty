import React, { useState, useEffect } from 'react';
import AddBookingModal from './components/Dashboard/Calendar/AddBookingModal';
import NotificationBell from './components/Notifications/NotificationBell';
import { useNotifications } from './components/Notifications/NotificationsProvider';
import NotificationsModal from './components/Notifications/NotificationsModal';
import SupportButton from './components/Support/SupportButton';
import SupportChatModal from './components/Support/SupportChatModal';
import { useSupport } from './components/Support/SupportProvider';
import PushPrePrompt from './components/Push/PushPrePrompt';

/**
 * Глобальные элементы интерфейса, которые нужны на всех страницах:
 * колокольчик уведомлений, кнопка поддержки, модалки, pre-prompt push.
 */
export default function TopbarModals() {
    const [addBookingOpen, setAddBookingOpen] = useState(false);
    const { isModalOpen } = useNotifications();
    const { isModalOpen: isSupportOpen } = useSupport();
    
    // Читаем статус Push из data-атрибута #react-app
    const [pushStatus, setPushStatus] = useState(() => {
        const el = document.getElementById('react-app');
        const fromData = el?.dataset.pushStatus || 'unknown';
        
        // Если на сервере unknown, но в localStorage есть — используем localStorage
        if (fromData === 'unknown') {
            return localStorage.getItem('daty_push_status') || 'unknown';
        }
        
        // Сохраняем статус с сервера в localStorage
        localStorage.setItem('daty_push_status', fromData);
        return fromData;
    });

    const masterSlug = document.getElementById('react-app')?.dataset.masterSlug || '';
    const masterMode = document.getElementById('react-app')?.dataset.masterMode || 'home';

    useEffect(() => {
        function handleOpenAddBooking() {
            setAddBookingOpen(true);
        }
        window.addEventListener('openAddBooking', handleOpenAddBooking);
        return () => window.removeEventListener('openAddBooking', handleOpenAddBooking);
    }, []);

    function handleCreated() {
        setAddBookingOpen(false);
        window.location.reload();
    }

    return (
        <>
            <NotificationBell />
            <SupportButton />

            {isModalOpen && <NotificationsModal />}
            {isSupportOpen && <SupportChatModal />}

            {addBookingOpen && (
                <AddBookingModal
                    masterSlug={masterSlug}
                    masterMode={masterMode}
                    onClose={() => setAddBookingOpen(false)}
                    onCreated={handleCreated}
                />
            )}

            <PushPrePrompt
                pushStatus={pushStatus}
                onStatusChange={setPushStatus}
            />
        </>
    );
}
