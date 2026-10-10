import React from 'react';
import useModal from '../../hooks/useModal';
import { removeFromBlacklist } from '../../api/clients';
import styles from './BlacklistSection.module.css';

export default function BlacklistSection({
    blacklist,
    loading,
    onAddClick,
    onDataChanged,
}) {
    const { showAlert, showConfirm } = useModal();

    async function handleRemove(client) {
        const ok = await showConfirm(
            `Удалить клиента "${client.name}" из чёрного списка?`,
            { type: 'danger' }
        );
        if (!ok) return;

        try {
            const data = await removeFromBlacklist(client.id);
            if (data.success) {
                onDataChanged();
            } else {
                showAlert(data.error || 'Ошибка удаления', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        }
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h5 className={styles.cardTitle}>
                    <i className="fas fa-ban" />
                    Чёрный список
                </h5>
                <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={onAddClick}
                >
                    <i className="fas fa-plus" />
                    Добавить
                </button>
            </div>

            <div className={styles.cardBody}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : blacklist.length === 0 ? (
                    <div className={styles.emptyState}>Чёрный список пуст</div>
                ) : (
                    <>
                        {/* ДЕСКТОП: таблица */}
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Имя</th>
                                        <th>Телефон</th>
                                        <th>Причина</th>
                                        <th>Дата добавления</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blacklist.map(client => (
                                        <tr key={client.id}>
                                            <td>{client.name}</td>
                                            <td>{client.phone}</td>
                                            <td>{client.reason || '—'}</td>
                                            <td>{client.created_at}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                    onClick={() => handleRemove(client)}
                                                    title="Удалить из чёрного списка"
                                                >
                                                    <i className="fas fa-trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* МОБИЛЬНЫЙ: карточки */}
                        <div className={styles.mobileList}>
                            {blacklist.map(client => (
                                <div key={client.id} className={styles.mobileCard}>
                                    <div className={styles.mobileHeader}>
                                        <div className={styles.mobileName}>
                                            <strong>{client.name}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                            onClick={() => handleRemove(client)}
                                            title="Удалить"
                                        >
                                            <i className="fas fa-trash" />
                                        </button>
                                    </div>
                                    <div className={styles.mobileBody}>
                                        <div className={styles.mobileRow}>
                                            <span className={styles.mobilePhone}>{client.phone}</span>
                                            <span className={styles.mobileDate}>{client.created_at}</span>
                                        </div>
                                        <div className={styles.mobileReason}>
                                            {client.reason || '—'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}