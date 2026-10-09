import React from 'react';
import ReactDOM from 'react-dom/client';
import ServicesPage from '../components/Services/ServicesPage';
import { ModalProvider } from '../components/modals';

// Страница «Услуги»
const servicesEl = document.getElementById('react-services');
if (servicesEl) {
    ReactDOM.createRoot(servicesEl).render(
        <ModalProvider>
            <ServicesPage />
        </ModalProvider>
    );
}