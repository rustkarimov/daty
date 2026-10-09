import React from 'react';
import ReactDOM from 'react-dom/client';
import SchedulePage from '../components/Schedule/SchedulePage';
import { ModalProvider } from '../components/modals';

// Страница «Расписание»
const scheduleEl = document.getElementById('react-schedule');
if (scheduleEl) {
    ReactDOM.createRoot(scheduleEl).render(
        <ModalProvider>
            <SchedulePage />
        </ModalProvider>
    );
}