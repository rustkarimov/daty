import React, { useState } from 'react';
import Calendar from './Calendar/Calendar';
import UpcomingBookings from './UpcomingBookings';
import EditBookingModal from './Calendar/EditBookingModal';

export default function Dashboard({ masterSlug, masterMaxLink }) {
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    function handleEditBooking(bookingId) {
        setEditingBookingId(bookingId);
    }

    function handleCloseEdit() {
        setEditingBookingId(null);
    }

    function handleDataChanged() {
        // Обновляем оба компонента — календарь и список записей
        setRefreshKey(prev => prev + 1);
    }

    return (
        <>
            <UpcomingBookings
                masterSlug={masterSlug}
                masterMaxLink={masterMaxLink}
                onEdit={handleEditBooking}
            />

            <div className="card mb-4">
                <div className="card-inner">
                    <div className="card-body">
                        <Calendar
                            key={`calendar-${refreshKey}`}
                            masterSlug={masterSlug}
                        />
                    </div>
                </div>
            </div>

            {editingBookingId && (
                <EditBookingModal
                    bookingId={editingBookingId}
                    masterSlug={masterSlug}
                    onClose={handleCloseEdit}
                    onSaved={handleDataChanged}
                />
            )}
        </>
    );
}