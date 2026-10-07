import React, { useState } from 'react';
import Calendar from './Calendar/Calendar';
import UpcomingBookings from './UpcomingBookings';
import EditBookingModal from './Calendar/EditBookingModal';
import AlertModal from './AlertModal';

export default function Dashboard({ masterSlug, masterMaxLink }) {
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [alert, setAlert] = useState(null); // { message, title, type }

    function handleEditBooking(bookingId) {
        setEditingBookingId(bookingId);
    }

    function handleCloseEdit() {
        setEditingBookingId(null);
    }

    function handleDataChanged(message, type = 'success') {
        setRefreshKey(prev => prev + 1);
        if (message) {
            setAlert({ message, type });
        }
    }

    function closeAlert() {
        setAlert(null);
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

            {editingBookingId && (
                <EditBookingModal
                    bookingId={editingBookingId}
                    masterSlug={masterSlug}
                    onClose={handleCloseEdit}
                    onSaved={() => handleDataChanged('Запись обновлена')}
                />
            )}

            {alert && (
                <AlertModal
                    message={alert.message}
                    title={alert.title}
                    type={alert.type}
                    onClose={closeAlert}
                />
            )}
        </>
    );
}