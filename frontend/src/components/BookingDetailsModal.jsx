import React, { useState, useEffect } from 'react';
import { loadBookingDetails } from '../api/bookingDetails';
import styles from './BookingDetailsModal.module.css';

export default function BookingDetailsModal({ bookingId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        loadBookingDetails(bookingId)
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки деталей:', error);
                setLoading(false);
            });
    }, [bookingId]);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        Подробности записи
                    </h5>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className="spinner-border" style={{ color: '#4053d3' }} />
                        </div>
                    ) : !data?.success ? (
                        <p className="text-danger">Не удалось загрузить данные</p>
                    ) : (
                        <>
                            {/* Клиент */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Клиент</div>
                                <p className={styles.sectionValue}>{data.client_name}</p>
                            </div>

                            {/* Телефон */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Телефон</div>
                                <p className={styles.sectionValue}>
                                    {data.client_phone_formatted || data.client_phone}
                                </p>
                            </div>

                            {/* Дата */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Дата</div>
                                <p className={styles.sectionValue}>{data.date}</p>
                            </div>

                            {/* Время */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Время</div>
                                <p className={styles.sectionValue}>{data.time || '—'}</p>
                            </div>

                            {/* Услуги */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>
                                    Услуги ({data.total_services})
                                </div>
                                <div className={styles.servicesList}>
                                    {data.services?.map((s, i) => (
                                        <div key={i} className={styles.serviceItem}>
                                            {s.category_name && (
                                                <span className={styles.category}>{s.category_name}: </span>
                                            )}
                                            {s.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Комментарий */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Комментарий</div>
                                <p className={styles.sectionValue}>{data.comment || '—'}</p>
                            </div>

                            <hr className={styles.divider} />

                            {/* История визитов */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>
                                    История визитов ({data.client_stats?.total_visits || 0})
                                </div>
                                <div className={styles.historyBox}>
                                    {data.client_stats?.visits?.length > 0 ? (
                                        data.client_stats.visits.map((v, i) => (
                                            <div key={i} className={styles.historyItem}>
                                                <span className={styles.historyDate}>{v.date}</span>
                                                <span className={styles.historyTime}>{v.time}</span>
                                                <span className={styles.historyService}>
                                                    {v.category ? `${v.category}: ` : ''}
                                                    {v.service}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.sectionValue}>Нет других записей</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnSecondary} onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}