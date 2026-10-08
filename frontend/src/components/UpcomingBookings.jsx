import React, { useState, useEffect } from 'react';
import { loadBookings, confirmBooking, unconfirmBooking } from '../api/bookingsList';
import { deleteBooking } from '../api/day';
import BookingDetailsModal from './BookingDetailsModal';
import styles from './UpcomingBookings.module.css';
import useModal from '../hooks/useModal';

export default function UpcomingBookings({ masterSlug, masterMaxLink, onEdit, onDataChanged }) {
    const [bookings, setBookings] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(3);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [detailsBookingId, setDetailsBookingId] = useState(null);
    const [contactMenuId, setContactMenuId] = useState(null);
    const { showAlert, showConfirm } = useModal();

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
                const msg = booking.confirmed_by_master ? 'Подтверждение снято' : 'Запись подтверждена';
                if (onDataChanged) onDataChanged(msg);
            } else {
                showAlert(data.error || 'Ошибка', 'error');
            }
        } catch (error) {
            console.error(error);
            showAlert('Ошибка соединения', 'error');
        }
    }

    async function handleDelete(booking) {
        const ok = await showConfirm(
            `Удалить запись клиента "${booking.client_name}" на ${booking.time}?`,
            { type: 'danger' }
        );
        if (!ok) return;
        try {
            const data = await deleteBooking(booking.id);
            if (data.success) {
                setBookings(prev => prev.filter(b => b.id !== booking.id));
                setTotal(prev => prev - 1);
                if (onDataChanged) onDataChanged('Запись удалена');
            } else {
                showAlert(data.error || 'Ошибка удаления', 'error');
            }
        } catch (error) {
            console.error(error);
            showAlert('Ошибка соединения', 'error');
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
                showAlert('💬 Telegram не установлен или не открылся.\nСвяжитесь с клиентом по телефону.', 'info');
            }
        }, 2000);
    }

    function openMax() {
        if (!masterMaxLink) {
            showAlert('⚠️ Ссылка на MAX не настроена.\nДобавьте её в настройках профиля.', 'warning');
            return;
        }
        window.open(masterMaxLink, '_blank');
    }

    function toggleContactMenu(e, bookingId) {
        e.stopPropagation();
        setContactMenuId(prev => prev === bookingId ? null : bookingId);
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                    <h5>
                        <i className="fas fa-clock" style={{ color: 'var(--primary)' }} />
                        Ближайшие записи
                    </h5>
                </div>
                <div className={styles.cardBody}>
                    {loading && bookings.length === 0 ? (
                        <div className={styles.loadingState}>
                            <div className="spinner-border" style={{ color: '#4053d3' }} />
                        </div>
                    ) : bookings.length === 0 ? (
                        <p className={styles.emptyState}>Нет предстоящих записей</p>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
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
                                            <td>{b.date}</td>
                                            <td>{b.time}</td>
                                            <td>{b.client_name}</td>
                                            <td>{b.service_name}</td>
                                            <td className={styles.actionsCell}>
                                                <div className={styles.allButtonsRow}>
                                                    <button
                                                        className={styles.iconBtn}
                                                        onClick={() => setDetailsBookingId(b.id)}
                                                        title="Подробности"
                                                    >
                                                        <i className="fas fa-info-circle" />
                                                    </button>
                                                    <button
                                                        className={styles.iconBtn}
                                                        onClick={() => onEdit(b.id)}
                                                        title="Редактировать"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                                                        onClick={() => handleDelete(b)}
                                                        title="Удалить"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                    <div className={styles.contactWrapper}>
                                                        <button
                                                            className={styles.contactBtn}
                                                            onClick={(e) => toggleContactMenu(e, b.id)}
                                                        >
                                                            <i className="fas fa-phone-alt" />
                                                            <span>Связаться</span>
                                                            <i className="fas fa-chevron-down" />
                                                        </button>
                                                        {contactMenuId === b.id && (
                                                            <div className={styles.contactMenu} onClick={e => e.stopPropagation()}>
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
                                                                    <span className={styles.maxIcon}>M</span> MAX
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        className={`${styles.confirmBtn} ${b.confirmed_by_master ? styles.confirmed : ''}`}
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
                <div className={styles.cardFooter}>
                    <button
                        className={styles.loadMoreBtn}
                        style={{ display: hasMore ? 'flex' : 'none' }}
                        onClick={handleLoadMore}
                    >
                        <i className="fas fa-chevron-down" />
                        Показать еще
                    </button>

                    <div className={styles.footerInfoRow}>
                        <div className={styles.footerRight}>
                            <span className={styles.totalLabel}>Всего записей</span>
                            <span className={styles.totalNumber}>{total}</span>
                        </div>
                        <div className={styles.footerLeft}>
                            <label className={styles.limitLabel}>Показывать:</label>
                            <select
                                className={styles.limitSelect}
                                value={limit}
                                onChange={e => handleLimitChange(parseInt(e.target.value))}
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