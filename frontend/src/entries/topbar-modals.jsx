import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AddBookingModal from '../components/Calendar/AddBookingModal';
import { ModalProvider } from '../components/modals';

/**
 * Глобальный компонент модалок, который живёт на всех страницах.
 * Открывается через CustomEvent 'openAddBooking' (см. base.html).
 */
function TopbarModals({ masterSlug }) {
    const [addBookingOpen, setAddBookingOpen] = useState(false);

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
        // Перезагружаем страницу, чтобы обновить данные на ней
        window.location.reload();
    }

    return (
        <>
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
            <TopbarModals masterSlug={masterSlug} />
        </ModalProvider>
    );
}