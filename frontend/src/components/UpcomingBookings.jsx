import React, { useState, useEffect } from 'react';
import { loadBookings, confirmBooking, unconfirmBooking } from '../api/bookingsList';
import { deleteBooking } from '../api/day';
import BookingDetailsModal from './BookingDetailsModal';

export default function UpcomingBookings({ masterSlug, masterMaxLink, onEdit, onDataChanged }) {
    const [bookings, setBookings] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(3);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [detailsBookingId, setDetailsBookingId] = useState(null);
    const [contactMenuId, setContactMenuId] = useState(null);

    useEffect(() => {
        loadData(1, false);
    }, [limit]);

    async function loadData(p, append) {
        setLoading(true);
        try {
            const data = await loadBookings(p, limit);
            if (append) {
                setBookings(prev => [...prev, ...(data.bookings || [])]);
            } else {
                setBookings(data.bookings || []);
            }
            setTotal(data.total || 0);
            setPage(p);
            setHasMore(!!data.has_more);
        } catch (error) {
            console.error('Ошибка загрузки записей:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleLimitChange(newLimit) {
        setLimit(newLimit);
    }

    function handleLoadMore() {
        loadData(page + 1, true);
    }

    async function handleToggleConfirm(booking) {
        try {
            const fn = booking.confirmed_by_master ? unconfirmBooking : confirmBooking;
            const data = await fn(booking.id);         
            if (data.success) {
                setBookings(prev => prev.map(b =>
                    b.id === booking.id ? { ...b, confirmed_by_master: !b.confirmed_by_master } : b
                ));
                // НЕ вызываем onDataChanged — подтверждение не влияет на календарь
            } else {
                alert(data.error || 'Ошибка');
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка соединения');
        }
    }

    async function handleDelete(booking) {
        if (!confirm(`Удалить запись клиента "${booking.client_name}" на ${booking.time}?`)) return;
        try {
            const data = await deleteBooking(booking.id);
            if (data.success) {
                // Удаляем локально, не сбрасывая пагинацию
                setBookings(prev => prev.filter(b => b.id !== booking.id));
                setTotal(prev => prev - 1);
                if (onDataChanged) onDataChanged();
            } else {
                alert(data.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка соединения');
        }
    }

    useEffect(() => {
        function handleClickOutside() {
            setContactMenuId(null);
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    function cleanPhone(phone) {
        return (phone || '').replace(/\D/g, '');
    }

    function callClient(phone) {
        window.location.href = `tel:+${cleanPhone(phone)}`;
    }

    function sendSms(phone) {
        window.location.href = `sms:+${cleanPhone(phone)}`;
    }

    function openWhatsApp(phone) {
        window.open(`https://wa.me/${cleanPhone(phone)}`, '_blank');
    }

    function openTelegram(phone) {
        const clean = cleanPhone(phone);
        const tgLink = `tg://resolve?phone=${clean}`;
        window.location.href = tgLink;
        setTimeout(() => {
            if (document.hasFocus()) {
                alert('💬 Telegram не установлен или не открылся.\nСвяжитесь с клиентом по телефону.');
            }
        }, 2000);
    }

    function openMax() {
        if (!masterMaxLink) {
            alert('⚠️ Ссылка на MAX не настроена.\nДобавьте её в настройках профиля.');
            return;
        }
        window.open(masterMaxLink, '_blank');
    }

    function toggleContactMenu(e, bookingId) {
        e.stopPropagation();  // не закрываем меню сразу
        setContactMenuId(prev => prev === bookingId ? null : bookingId);
    }

    return (
        <div className="card mb-4 booking-card">
            <div className="card-inner">
                <div className="card-header bg-white">
                    <h5 className="mb-0">
                        <i className="fas fa-clock me-2" style={{ color: 'var(--primary)' }} />
                        Ближайшие записи
                    </h5>
                </div>
                <div className="card-body">
                    {loading && bookings.length === 0 ? (
                        <div className="text-center py-3">
                            <div className="spinner-border" style={{ color: '#4053d3' }} />
                        </div>
                    ) : bookings.length === 0 ? (
                        <p className="text-muted text-center mb-0">Нет предстоящих записей</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table" id="upcoming-bookings-table">
                                <thead>
                                    <tr>
                                        <th>Дата</th>
                                        <th>Время</th>
                                        <th>Клиент</th>
                                        <th>Услуги</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr
                                            key={b.id}
                                            style={contactMenuId === b.id ? { position: 'relative', zIndex: 100 } : undefined}
                                        >
                                            <td data-label="Дата">{b.date}</td>
                                            <td data-label="Время">{b.time}</td>
                                            <td data-label="Клиент">{b.client_name}</td>
                                            <td data-label="Услуги">{b.service_name}</td>
                                            <td data-label="" className="actions-cell">
                                                <div className="all-buttons-row">
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => setDetailsBookingId(b.id)}
                                                        title="Подробности"
                                                    >
                                                        <i className="fas fa-info-circle" />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => onEdit(b.id)}
                                                        title="Редактировать"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => handleDelete(b)}
                                                        title="Удалить"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                    <div className="contact-dropdown-wrapper" style={{ position: 'relative', display: 'inline-block', zIndex: 10 }}>
                                                        <button
                                                            className="contact-dropdown-btn"
                                                            onClick={(e) => toggleContactMenu(e, b.id)}
                                                        >
                                                            <i className="fas fa-phone-alt" />
                                                            <span>Связаться</span>
                                                            <i className="fas fa-chevron-down" />
                                                        </button>
                                                        {contactMenuId === b.id && (
                                                            <div className="contact-dropdown-menu" style={{ display: 'block', zIndex: 1100 }} onClick={e => e.stopPropagation()}>
                                                                <button onClick={() => callClient(b.phone)}>
                                                                    <i className="fas fa-phone" /> Позвонить
                                                                </button>
                                                                <button onClick={() => sendSms(b.phone)}>
                                                                    <i className="fas fa-sms" /> SMS
                                                                </button>
                                                                <button onClick={() => openTelegram(b.phone)}>
                                                                    <i className="fab fa-telegram-plane" /> Telegram
                                                                </button>
                                                                <button onClick={() => openWhatsApp(b.phone)}>
                                                                    <i className="fab fa-whatsapp" /> WhatsApp
                                                                </button>
                                                                <button onClick={openMax} disabled={!masterMaxLink}>
                                                                    <span className="max-icon">M</span> MAX
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        className={`confirm-btn ${b.confirmed_by_master ? 'confirmed' : ''}`}
                                                        onClick={() => handleToggleConfirm(b)}
                                                        title={b.confirmed_by_master ? 'Подтверждено' : 'Подтвердить'}
                                                    >
                                                        <i className={`fas ${b.confirmed_by_master ? 'fa-check-circle' : 'fa-circle'}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center pt-0 flex-wrap">
                    <button
                        className="btn btn-sm btn-outline-primary"
                        style={{ display: hasMore ? 'inline-block' : 'none' }}
                        onClick={handleLoadMore}
                    >
                        <i className="fas fa-chevron-down me-1" />
                        Показать еще
                    </button>

                    <div className="footer-info-row">
                        <div className="footer-right">
                            <span className="total-label">Всего записей</span>
                            <span className="total-number">{total}</span>
                        </div>
                        <div className="footer-left">
                            <label className="form-label me-1 mb-0 small">Показывать:</label>
                            <select
                                className="form-select form-select-sm"
                                value={limit}
                                onChange={e => handleLimitChange(parseInt(e.target.value))}
                                style={{ width: 'auto' }}
                            >
                                <option value="3">3</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            {detailsBookingId && (
                <BookingDetailsModal
                    bookingId={detailsBookingId}
                    onClose={() => setDetailsBookingId(null)}
                />
            )}
        </div>
    );
}