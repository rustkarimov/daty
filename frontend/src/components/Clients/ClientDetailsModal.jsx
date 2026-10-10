import React, { useState } from 'react';
import BlacklistModal from './BlacklistModal';
import styles from './ClientDetailsModal.module.css';

export default function ClientDetailsModal({ client, onClose }) {
    const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <>
            <div className={styles.backdrop} onClick={handleBackdropClick}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                    <div className={styles.header}>
                        <h5 className={styles.title}>Подробности о клиенте</h5>
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
                        {!client ? (
                            <p className={styles.emptyText}>Клиент не найден</p>
                        ) : (
                            <div className={styles.grid}>
                                {/* Левая колонка */}
                                <div className={styles.column}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Имя</span>
                                        <span className={styles.detailValue}>{client.name}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Телефон</span>
                                        <span className={styles.detailValue}>{client.phone || '—'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Первый визит</span>
                                        <span className={styles.detailValue}>{client.first_visit || '—'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Последний визит</span>
                                        <span className={styles.detailValue}>{client.last_visit || '—'}</span>
                                    </div>
                                    {client.all_names && client.all_names.length > 0 && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Все имена</span>
                                            <ul className={styles.namesList}>
                                                {client.all_names.map((n, i) => (
                                                    <li key={i}>{n}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {client.is_blacklisted && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Статус</span>
                                            <span className={styles.badgeDanger}>В чёрном списке</span>
                                        </div>
                                    )}
                                </div>

                                {/* Правая колонка: услуги */}
                                <div className={styles.column}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Услуги клиента</span>
                                        {client.services && Object.keys(client.services).length > 0 ? (
                                            <ul className={styles.servicesList}>
                                                {Object.entries(client.services)
                                                    .sort((a, b) => b[1] - a[1])
                                                    .map(([name, count], i) => (
                                                        <li key={i} className={styles.serviceItem}>
                                                            <span>{name}</span>
                                                            <span className={styles.badgeVisits}>{count} раз</span>
                                                        </li>
                                                    ))}
                                            </ul>
                                        ) : (
                                            <span className={styles.emptyText}>Нет данных</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.btnSecondary} onClick={onClose}>
                            Закрыть
                        </button>
                        {client && !client.is_blacklisted && (
                            <button
                                type="button"
                                className={styles.btnDanger}
                                onClick={() => setBlacklistModalOpen(true)}
                            >
                                <i className="fas fa-ban" />
                                В чёрный список
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Модалка добавления в чёрный список */}
            {blacklistModalOpen && (
                <BlacklistModal
                    onClose={() => setBlacklistModalOpen(false)}
                    onSaved={() => {
                        setBlacklistModalOpen(false);
                        onClose();
                        window.location.reload();
                    }}
                    initialName={client?.name || ''}
                    initialPhone={client?.phone || ''}
                />
            )}
        </>
    );
}