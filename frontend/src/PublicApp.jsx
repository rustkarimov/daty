// frontend/src/PublicApp.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { ModalProvider } from './components/modals';
import MasterPage from './components/Public/MasterPage';

// Публичные страницы (создадим на следующих этапах)
// import MyBookingsPage from './components/Public/MyBookingsPage';
// import BookingClientPage from './components/Public/BookingClientPage';

export default function PublicApp() {
    return (
        <ModalProvider>
            <PublicPagePortals />
        </ModalProvider>
    );
}

function PublicPagePortals() {
    const masterEl = document.getElementById('react-master-page');
    const myBookingsEl = document.getElementById('react-my-bookings');
    const clientBookingEl = document.getElementById('react-client-booking');

    return (
        <>
            {masterEl && createPortal(
                <MasterPage
                    identifier={masterEl.dataset.identifier || ''}
                    masterMode={masterEl.dataset.masterMode || 'home'}
                    masterAddress={masterEl.dataset.masterAddress || ''}
                    travelTime={parseInt(masterEl.dataset.travelTime || '0', 10)}
                />,
                masterEl
            )}

            {/* Эти блоки раскомментируем по мере готовности компонентов */}

            {/* {myBookingsEl && createPortal(
                <MyBookingsPage
                    identifier={myBookingsEl.dataset.identifier || ''}
                />,
                myBookingsEl
            )} */}

            {/* {clientBookingEl && createPortal(
                <BookingClientPage
                    identifier={clientBookingEl.dataset.identifier || ''}
                    token={clientBookingEl.dataset.token || ''}
                />,
                clientBookingEl
            )} */}
        </>
    );
}