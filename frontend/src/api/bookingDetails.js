export async function loadBookingDetails(bookingId) {
    const r = await fetch(`/api/booking/${bookingId}/details/`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}