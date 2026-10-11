import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AddBookingModal from '../components/Calendar/AddBookingModal';
import NotificationBell from '../components/Notifications/NotificationBell';
import NotificationsProvider, { useNotifications } from '../components/Notifications/NotificationsProvider';
import { ModalProvider } from '../components/modals';
import NotificationsModal from '../components/Notifications/NotificationsModal';

function TopbarModals({ masterSlug }) {
    const [addBookingOpen, setAddBookingOpen] = useState(false);
    const { isModalOpen } = useNotifications();

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

            {isModalOpen && <NotificationsModal />}

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
                <TopbarModals masterSlug={masterSlug} />
            </NotificationsProvider>
        </ModalProvider>
    );
}