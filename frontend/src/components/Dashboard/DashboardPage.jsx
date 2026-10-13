import React, { useState } from 'react';
import StatsGrid from './StatsGrid';
import PublicLinkCard from './PublicLinkCard';
import UpcomingBookings from './UpcomingBookings';
import Calendar from './Calendar/Calendar';
import EditBookingModal from './Calendar/EditBookingModal';
import PushSettings from '../Push/PushSettings';
import useModal from '../../hooks/useModal';

export default function DashboardPage({
    masterSlug,
    masterMaxLink,
    totalBookings,
    totalServices,
    totalClients,
    publicLink,
}) {
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const { showAlert } = useModal();

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

    return (
        <>
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

            <PushSettings />

            {editingBookingId && (
                <EditBookingModal
                    bookingId={editingBookingId}
                    masterSlug={masterSlug}
                    onClose={handleCloseEdit}
                    onSaved={() => handleDataChanged('Запись обновлена')}
                />
            )}
        </>
    );
}