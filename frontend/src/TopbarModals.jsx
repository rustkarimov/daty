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

    // masterSlug для AddBookingModal берём из #react-app (общий для всех страниц)
    const masterSlug = document.getElementById('react-app')?.dataset.masterSlug || '';
    const masterMode = document.getElementById('react-app')?.dataset.masterMode || 'home';

    useEffect(() => {
        function handleOpenAddBooking() {
            setAddBookingOpen(true);
        }

        window.addEventListener('openAddBooking', handleOpenAddBooking);
        return () => {
            window.removeEventListener('openAddBooking', handleOpenAddBooking);
        };
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

            <PushPrePrompt />
        </>
    );
}