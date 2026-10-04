import React, { useState, useEffect } from 'react';
import { loadBookingDetails } from '../api/bookingDetails';

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
        <div
            className="modal fade show"
            style={{
                display: 'block',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 1080,
                overflowY: 'auto',
            }}
            onClick={handleBackdropClick}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-info-circle me-2" style={{ color: 'var(--primary)' }} />
                            Подробности записи
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-3">
                                <div className="spinner-border" style={{ color: '#4053d3' }} />
                            </div>
                        ) : !data?.success ? (
                            <p className="text-danger">Не удалось загрузить данные</p>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <strong><i className="fas fa-user me-2" />Клиент:</strong>
                                    <p className="mt-1 mb-0">{data.client_name}</p>
                                </div>
                                <div className="mb-3">
                                    <strong><i className="fas fa-phone me-2" />Телефон:</strong>
                                    <p className="mt-1 mb-0">{data.client_phone_formatted || data.client_phone}</p>
                                </div>
                                <div className="mb-3">
                                    <strong><i className="fas fa-calendar-day me-2" />Дата:</strong>
                                    <p className="mt-1 mb-0">{data.date}</p>
                                </div>
                                <div className="mb-3">
                                    <strong><i className="fas fa-clock me-2" />Время:</strong>
                                    <p className="mt-1 mb-0">{data.time || '—'}</p>
                                </div>
                                <div className="mb-3">
                                    <strong><i className="fas fa-cut me-2" />Услуги ({data.total_services}):</strong>
                                    <div className="mt-2">
                                        {data.services?.map((s, i) => (
                                            <div key={i} className="d-flex justify-content-between align-items-center mb-2 p-2">
                                                <div>
                                                    {s.category_name && (
                                                        <span className="text-muted small">{s.category_name}: </span>
                                                    )}
                                                    {s.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <strong><i className="fas fa-comment me-2" />Комментарий:</strong>
                                    <p className="mt-1 mb-0">{data.comment || '—'}</p>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <strong><i className="fas fa-chart-line me-2" />Статистика клиента:</strong>
                                    <div className="mt-2 p-2 bg-light rounded">
                                        <div className="row text-center">
                                            <div className="col-4">
                                                <div className="fs-4 fw-bold" style={{ color: 'var(--primary)' }}>
                                                    {data.client_stats?.total_visits || 0}
                                                </div>
                                                <div className="small text-muted">Всего визитов</div>
                                            </div>
                                            <div className="col-4">
                                                <div className="small text-muted">Первый визит</div>
                                                <div><strong>{data.client_stats?.first_visit || '—'}</strong></div>
                                            </div>
                                            <div className="col-4">
                                                <div className="small text-muted">Последний визит</div>
                                                <div><strong>{data.client_stats?.last_visit || '—'}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {data.client_stats?.visits?.length > 0 && (
                                    <div className="mb-3">
                                        <strong><i className="fas fa-history me-2" />История визитов:</strong>
                                        <div className="mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {data.client_stats.visits.map((v, i) => (
                                                <div key={i} className="d-flex justify-content-between align-items-center mb-1 p-1">
                                                    <span>{v.date}</span>
                                                    <span className="text-muted small">{v.time}</span>
                                                    <span className="text-muted small">{v.service}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    );
}