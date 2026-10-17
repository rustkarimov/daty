// frontend/src/entries/public_app.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import PublicApp from '../PublicApp';

const el = document.getElementById('react-public-app');
if (el) {
    ReactDOM.createRoot(el).render(<PublicApp />);
}