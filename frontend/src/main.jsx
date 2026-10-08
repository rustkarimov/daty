import React from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './components/Dashboard';
import PushSettings from './components/PushSettings';
import ServicesPage from './components/Services/ServicesPage';
import { ModalProvider } from './components/modals';

// Дашборд
const dashboardEl = document.getElementById('react-dashboard');
if (dashboardEl) {
    const masterSlug = dashboardEl.dataset.masterSlug || '';
    const masterMaxLink = dashboardEl.dataset.masterMaxLink || '';
    ReactDOM.createRoot(dashboardEl).render(
        <ModalProvider>
            <Dashboard masterSlug={masterSlug} masterMaxLink={masterMaxLink} />
        </ModalProvider>
    );
}

// Push-секция (отдельно)
const pushEl = document.getElementById('react-push-settings');
if (pushEl) {
    ReactDOM.createRoot(pushEl).render(
        <ModalProvider>
            <PushSettings />
        </ModalProvider>
    );
}

// Страница «Услуги»
const servicesEl = document.getElementById('react-services');
if (servicesEl) {
    ReactDOM.createRoot(servicesEl).render(
        <ModalProvider>
            <ServicesPage />
        </ModalProvider>
    );
}