import React from 'react';
import ReactDOM from 'react-dom/client';
import ProfilePage from '../components/Profile/ProfilePage';
import { ModalProvider } from '../components/modals';

const profileEl = document.getElementById('react-profile');
if (profileEl) {
    const initialData = JSON.parse(profileEl.dataset.initial || '{}');
    const masterId = profileEl.dataset.masterId || '';

    ReactDOM.createRoot(profileEl).render(
        <ModalProvider>
            <ProfilePage initialData={initialData} masterId={masterId} />
        </ModalProvider>
    );
}