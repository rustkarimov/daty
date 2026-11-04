import React, { useState, useEffect } from 'react';
import StatsGrid from './StatsGrid';
import PublicLinkCard from './PublicLinkCard';
import UpcomingBookings from './UpcomingBookings';
import Calendar from './Calendar/Calendar';
import EditBookingModal from './Calendar/EditBookingModal';
import PushSettings from '../Push/PushSettings';
import WorkModeToggle from './WorkModeToggle';
import OnboardingModal from './OnboardingModal';
import useModal from '../../hooks/useModal';

export default function DashboardPage({
    masterSlug,
    masterMaxLink,
    masterMode,
    totalBookings,
    totalServices,
    totalClients,
    publicLink,
    hasServices = false,
    hasSchedule = false,
}) {
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    
    const [showOnboardingBanner, setShowOnboardingBanner] = useState(() => {
        return localStorage.getItem('daty_onboarding_dismissed') !== 'true';
    });
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    const [pushStatus, setPushStatus] = useState(() => {
    const el = document.getElementById('react-app');
        return el?.dataset.pushStatus || 'unknown';
    });

    const { showAlert } = useModal();

    useEffect(() => {
        function handleOpen() {
            setIsOnboardingOpen(true);
        }
        window.addEventListener('openOnboarding', handleOpen);
        return () => window.removeEventListener('openOnboarding', handleOpen);
    }, []);

    function handleEditBooking(bookingId) {
        setEditingBookingId(bookingId);
    }

    function handleCloseEdit() {
        setEditingBookingId(null);
    }

    function handleDataChanged(message, type = 'success') {
        setRefreshKey(prev => prev + 1);
        if (message) {
            showAlert(message, type);
        }
    }

    function dismissBanner() {
        localStorage.setItem('daty_onboarding_dismissed', 'true');
        setShowOnboardingBanner(false);
    }

    function handleEnableOnboarding() {
        setIsOnboardingOpen(true);
        dismissBanner();
    }

    return (
        <>
            {showOnboardingBanner && (
                <div className="card mb-4" style={{ background: 'var(--primary-lighter)', border: '1px solid var(--primary-light)' }}>
                    <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h5 className="mb-1">👋 Добро пожаловать в ДАТЫ!</h5>
                            <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                                Чтобы подготовиться к работе, рекомендуем включить Подсказки.
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-pink" onClick={handleEnableOnboarding}>
                                Включить
                            </button>
                            <button className="btn btn-outline-secondary" onClick={dismissBanner}>
                                Скрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            

            <UpcomingBookings
                key={`upcoming-${refreshKey}`}
                masterSlug={masterSlug}
                masterMaxLink={masterMaxLink}
                onEdit={handleEditBooking}
                onDataChanged={handleDataChanged}
            />

            <div className="card mb-4">
                <div className="card-inner">
                    <div className="card-body">
                        <Calendar
                            key={`calendar-${refreshKey}`}
                            masterSlug={masterSlug}
                            masterMode={masterMode}
                            onExternalChange={handleDataChanged}
                        />
                    </div>
                </div>
            </div>

            <StatsGrid
                totalBookings={totalBookings}
                totalServices={totalServices}
                totalClients={totalClients}
            />

            <PublicLinkCard publicLink={publicLink} />

            <PushSettings 
                pushStatus={pushStatus}
                onStatusChange={setPushStatus}
            />

            <WorkModeToggle currentMode={masterMode} />

            {!showOnboardingBanner && (
                <div className="mb-3 text-end">
                    <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => setIsOnboardingOpen(true)}
                        style={{ borderRadius: '20px' }}
                    >
                        <i className="fas fa-question-circle me-1"></i>
                        Подсказки
                    </button>
                </div>
            )}

            

            {editingBookingId && (
                <EditBookingModal
                    bookingId={editingBookingId}
                    masterSlug={masterSlug}
                    onClose={handleCloseEdit}
                    onSaved={() => handleDataChanged('Запись обновлена')}
                />
            )}

            {isOnboardingOpen && (
                <OnboardingModal 
                    onClose={() => setIsOnboardingOpen(false)} 
                    hasServices={hasServices} 
                    hasSchedule={hasSchedule} 
                />
            )}
        </>
    );
}