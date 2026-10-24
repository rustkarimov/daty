import React from 'react';
import { createPortal } from 'react-dom';
import { ModalProvider } from './components/modals';
import NotificationsProvider from './components/Notifications/NotificationsProvider';
import SupportProvider from './components/Support/SupportProvider';
import PushProvider from './components/Push/PushProvider';
import TopbarModals from './TopbarModals';
import DashboardPage from './components/Dashboard/DashboardPage';
import ServicesPage from './components/Services/ServicesPage';
import SchedulePage from './components/Schedule/SchedulePage';
import ClientsPage from './components/Clients/ClientsPage';
import ProfilePage from './components/Profile/ProfilePage';


/**
 * Корневой компонент приложения.
 *
 * Содержит все глобальные провайдеры. Рендерит TopbarModals всегда.
 * Страницы (Dashboard, Services, Schedule, ...) рендерит через порталы
 * в соответствующие контейнеры, если они есть в DOM.
 */

export default function App() {
    return (
        <ModalProvider>
            <NotificationsProvider>
                <SupportProvider>
                    <PushProvider>
                        <TopbarModals />
                        <PagePortals />
                    </PushProvider>
                </SupportProvider>
            </NotificationsProvider>
        </ModalProvider>
    );
}

/**
 * Рендерит страницы через порталы в контейнеры, найденные в DOM.
 * На каждой странице свой контейнер: #react-dashboard, #react-services и т.д.
 */
function PagePortals() {
    const dashboardEl = document.getElementById('react-dashboard');
    const servicesEl = document.getElementById('react-services');
    const scheduleEl = document.getElementById('react-schedule');
    const clientsEl = document.getElementById('react-clients');
    const profileEl = document.getElementById('react-profile');

    return (
        <>
            {dashboardEl && createPortal(
                <DashboardPage
                    masterSlug={dashboardEl.dataset.masterSlug}
                    masterMaxLink={dashboardEl.dataset.masterMaxLink}
                    masterMode={dashboardEl.dataset.masterMode || 'home'}  // ← добавить
                    totalBookings={parseInt(dashboardEl.dataset.totalBookings || '0', 10)}
                    totalServices={parseInt(dashboardEl.dataset.totalServices || '0', 10)}
                    totalClients={parseInt(dashboardEl.dataset.totalClients || '0', 10)}
                    publicLink={dashboardEl.dataset.publicLink}
                />,
                dashboardEl
            )}

            {servicesEl && createPortal(
                <ServicesPage />,
                servicesEl
            )}

            {scheduleEl && createPortal(
                <SchedulePage
                    masterMode={scheduleEl.dataset.masterMode || 'home'}
                    initialAwayTravelBefore={parseInt(scheduleEl.dataset.awayTravelBefore || '0', 10)}
                    initialAwayTravelAfter={parseInt(scheduleEl.dataset.awayTravelAfter || '0', 10)}
                    initialArrivalWindow={parseInt(scheduleEl.dataset.arrivalWindow || '30', 10)}
                />,
                scheduleEl
            )}

            {clientsEl && createPortal(
                <ClientsPage />,
                clientsEl
            )}

            {profileEl && createPortal(
                <ProfilePage
                    masterId={profileEl.dataset.masterId || ''}
                    initialData={JSON.parse(profileEl.dataset.initial || '{}')}
                />,
                profileEl
            )}
        </>
    );
}