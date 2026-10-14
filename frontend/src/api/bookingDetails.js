import { getJson } from '../utils/api';

export async function loadBookingDetails(bookingId) {
    return getJson(`/api/booking/${bookingId}/details/`);
}