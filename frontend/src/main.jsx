import React from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './components/Dashboard';

const el = document.getElementById('react-dashboard');
if (el) {
    const masterSlug = el.dataset.masterSlug || '';
    const masterMaxLink = el.dataset.masterMaxLink || '';
    ReactDOM.createRoot(el).render(
        <Dashboard masterSlug={masterSlug} masterMaxLink={masterMaxLink} />
    );
}