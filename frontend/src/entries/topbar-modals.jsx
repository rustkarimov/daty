import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AddBookingModal from '../components/Calendar/AddBookingModal';
import NotificationBell from '../components/Notifications/NotificationBell';
import NotificationsProvider, { useNotifications } from '../components/Notifications/NotificationsProvider';
import NotificationsModal from '../components/Notifications/NotificationsModal';
import SupportButton from '../components/Support/SupportButton';
import SupportChatModal from '../components/Support/SupportChatModal';
import SupportProvider, { useSupport } from '../components/Support/SupportProvider';
import { ModalProvider } from '../components/modals';

function TopbarModals({ masterSlug }) {
    const [addBookingOpen, setAddBookingOpen] = useState(false);
    const { isModalOpen } = useNotifications();
    const { isModalOpen: isSupportOpen } = useSupport();

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
                    onClose={() => setAddBookingOpen(false)}
                    onCreated={handleCreated}
                />
            )}
        </>
    );
}

const el = document.getElementById('react-topbar-modals');
if (el) {
    const masterSlug = el.dataset.masterSlug || '';
    ReactDOM.createRoot(el).render(
        <ModalProvider>
            <NotificationsProvider>
                <SupportProvider>
                    <TopbarModals masterSlug={masterSlug} />
                </SupportProvider>
            </NotificationsProvider>
        </ModalProvider>
    );
}