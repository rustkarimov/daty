import React from 'react';
import ReactDOM from 'react-dom/client';
import ClientsPage from '../components/Clients/ClientsPage';
import { ModalProvider } from '../components/modals';

const clientsEl = document.getElementById('react-clients');
if (clientsEl) {
    ReactDOM.createRoot(clientsEl).render(
        <ModalProvider>
            <ClientsPage />
        </ModalProvider>
    );
}