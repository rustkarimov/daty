import React from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './components/Dashboard';
import PushSettings from './components/PushSettings';

// Дашборд
const dashboardEl = document.getElementById('react-dashboard');
if (dashboardEl) {
    const masterSlug = dashboardEl.dataset.masterSlug || '';
    const masterMaxLink = dashboardEl.dataset.masterMaxLink || '';
    ReactDOM.createRoot(dashboardEl).render(
        <Dashboard masterSlug={masterSlug} masterMaxLink={masterMaxLink} />
    );
}

// Push-секция (отдельно)
const pushEl = document.getElementById('react-push-settings');
if (pushEl) {
    ReactDOM.createRoot(pushEl).render(<PushSettings />);
}