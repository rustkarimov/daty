import React, { useState, useEffect, useRef } from 'react';
import styles from './ClientsList.module.css';

function applyPhoneMask(value) {
    // Если есть буквы — это не телефон, не трогаем
    if (/[a-zA-Zа-яА-Я]/.test(value)) return value;

    // Если нет ни одной цифры — не трогаем
    if (!/\d/.test(value)) return value;

    // Иначе — применяем маску
    let digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';

    // Нормализуем: с 8 → 7
    if (digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits[0] !== '7') digits = '7' + digits;

    if (digits.length > 11) digits = digits.slice(0, 11);

    let formatted = digits[0];
    if (digits.length > 1) formatted += ' ' + digits.slice(1, 4);
    if (digits.length > 4) formatted += ' ' + digits.slice(4, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 11);
    return formatted;
}

export default function ClientsList({
    clients,
    totalClients,
    loading,
    hasMore,
    isSearching,
    onSearch,
    onLoadMore,
    onShowDetails,
}) {
    const [query, setQuery] = useState('');
    const searchTimeout = useRef(null);

    // Дебаунс поиска — 300мс
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            onSearch(query);
        }, 300);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h5 className={styles.cardTitle}>Список клиентов</h5>
                <div className={styles.searchWrapper}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Поиск по имени или телефону..."
                        value={query}
                        onChange={e => setQuery(applyPhoneMask(e.target.value))}
                    />
                </div>
            </div>

            <div className={styles.cardBody}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : clients.length === 0 ? (
                    <div className={styles.emptyState}>
                        <i className="fas fa-search" />
                        <p>Ничего не найдено</p>
                    </div>
                ) : (
                    <>
                        {/* ДЕСКТОП: таблица */}
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Имя клиента</th>
                                        <th>Телефон</th>
                                        <th>Визитов</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client, index) => (
                                        <tr key={client.key}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <strong>{client.name}</strong>
                                                {client.is_blacklisted && (
                                                    <span className={styles.badgeDanger}>В чёрном списке</span>
                                                )}
                                            </td>
                                            <td>{client.phone || '—'}</td>
                                            <td>
                                                <span className={styles.badgeVisits}>{client.total_visits}</span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.iconBtn}
                                                    onClick={() => onShowDetails(client.key)}
                                                    title="Подробности"
                                                >
                                                    <i className="fas fa-info-circle" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* МОБИЛЬНЫЙ: карточки */}
                        <div className={styles.mobileList}>
                            {clients.map(client => (
                                <div key={client.key} className={styles.mobileCard}>
                                    <div className={styles.mobileCardHeader}>
                                        <div className={styles.mobileName}>
                                            <strong>{client.name}</strong>
                                            {client.is_blacklisted && (
                                                <span className={styles.badgeDanger}>В чёрном списке</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.iconBtn}
                                            onClick={() => onShowDetails(client.key)}
                                            title="Подробности"
                                        >
                                            <i className="fas fa-info-circle" />
                                        </button>
                                    </div>
                                    <div className={styles.mobileCardBody}>
                                        <div className={styles.mobileRow}>
                                            <span className={styles.mobilePhone}>{client.phone || '—'}</span>
                                            <span className={styles.mobileVisits}>
                                                <span className={styles.mobileVisitsLabel}>Визитов</span>
                                                <span className={styles.mobileVisitsCount}>{client.total_visits}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className={styles.cardFooter}>
                <span className={styles.totalInfo}>
                    {isSearching
                        ? `Найдено ${clients.length}`
                        : `Показано ${clients.length} из ${totalClients}`}
                </span>
                {hasMore && !isSearching && (
                    <button
                        type="button"
                        className={styles.btnOutline}
                        onClick={onLoadMore}
                    >
                        <i className="fas fa-chevron-down" />
                        Загрузить ещё
                    </button>
                )}
            </div>
        </div>
    );
}