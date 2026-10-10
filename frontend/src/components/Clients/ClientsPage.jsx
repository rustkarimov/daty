import React, { useState, useEffect, useCallback, useRef } from 'react';
import StatsCards from './StatsCards';
import ClientsList from './ClientsList';
import BlacklistSection from './BlacklistSection';
import BlacklistModal from './BlacklistModal';
import ClientDetailsModal from './ClientDetailsModal';
import useModal from '../../hooks/useModal';
import { loadClients, searchClients, loadBlacklist } from '../../api/clients';
import styles from './ClientsPage.module.css';

export default function ClientsPage() {
    // Данные
    const [clients, setClients] = useState([]);
    const [totalClients, setTotalClients] = useState(0);
    const [totalBookings, setTotalBookings] = useState(0);
    const [avgVisits, setAvgVisits] = useState(0);

    const [blacklist, setBlacklist] = useState([]);

    // Пагинация
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Загрузка
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingBlacklist, setLoadingBlacklist] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // Модалки
    const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
    const [detailsClientKey, setDetailsClientKey] = useState(null);

    // Хранилище данных всех клиентов (для модалки деталей)
    const clientsDataRef = useRef({});

    const { showAlert } = useModal();

    // ---------- Загрузка клиентов ----------

    const reloadClients = useCallback((resetPage = true) => {
        const targetPage = resetPage ? 1 : page;
        setLoadingClients(true);

        loadClients(targetPage, 10)
            .then(data => {
                const newClients = data.clients || [];

                // Сохраняем данные в ref — для ClientDetailsModal
                newClients.forEach(c => {
                    clientsDataRef.current[c.key] = c;
                });

                setClients(newClients);
                setTotalClients(data.total || 0);
                setHasMore(!!data.has_more);
                setPage(targetPage);
                setLoadingClients(false);

                // Используем готовые значения с бэкенда
                setTotalBookings(data.total_bookings || 0);
                setAvgVisits(data.avg_visits || 0);
            })
            .catch(error => {
                console.error('Ошибка загрузки клиентов:', error);
                setLoadingClients(false);
                showAlert('Не удалось загрузить клиентов', 'error');
            });
    }, [page, showAlert]);

    const reloadBlacklist = useCallback(() => {
        setLoadingBlacklist(true);
        loadBlacklist()
            .then(data => {
                setBlacklist(data.blacklist || []);
                setLoadingBlacklist(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки чёрного списка:', error);
                setLoadingBlacklist(false);
            });
    }, []);

    useEffect(() => {
        reloadClients(true);
        reloadBlacklist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Догрузка клиентов
    function loadMoreClients() {
        const nextPage = page + 1;

        // Сохраняем позицию скролла
        const scrollY = window.scrollY;

        loadClients(nextPage, 10)
            .then(data => {
                const newClients = data.clients || [];

                // Сохраняем новые данные в ref
                newClients.forEach(c => {
                    clientsDataRef.current[c.key] = c;
                });

                setClients(prev => [...prev, ...newClients]);
                setHasMore(!!data.has_more);
                setPage(nextPage);

                // Восстанавливаем позицию скролла после рендера
                requestAnimationFrame(() => {
                    window.scrollTo({ top: scrollY, behavior: 'instant' });
                });
            })
            .catch(error => {
                console.error('Ошибка догрузки клиентов:', error);
            });
    }

    // Поиск
    function handleSearch(query) {
        if (!query || query.trim() === '') {
            setIsSearching(false);
            reloadClients(true);
            return;
        }

        setIsSearching(true);
        setLoadingClients(true);

        searchClients(query)
            .then(data => {
                const newClients = data.clients || [];

                // Сохраняем в ref
                newClients.forEach(c => {
                    clientsDataRef.current[c.key] = c;
                });

                setClients(newClients);
                setTotalClients(data.total || 0);
                setHasMore(false);
                setLoadingClients(false);
            })
            .catch(error => {
                console.error('Ошибка поиска:', error);
                setLoadingClients(false);
            });
    }

    // Получить данные клиента по ключу для модалки
    function getClientData(key) {
        return clientsDataRef.current[key] || null;
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <h2>Статистика</h2>
            </div>

            <StatsCards
                totalClients={totalClients}
                totalBookings={totalBookings}
                avgVisits={avgVisits}
            />

            <ClientsList
                clients={clients}
                totalClients={totalClients}
                loading={loadingClients}
                hasMore={hasMore}
                isSearching={isSearching}
                onSearch={handleSearch}
                onLoadMore={loadMoreClients}
                onShowDetails={(key) => setDetailsClientKey(key)}
            />

            <BlacklistSection
                blacklist={blacklist}
                loading={loadingBlacklist}
                onAddClick={() => setBlacklistModalOpen(true)}
                onDataChanged={reloadBlacklist}
            />

            {blacklistModalOpen && (
                <BlacklistModal
                    onClose={() => setBlacklistModalOpen(false)}
                    onSaved={reloadBlacklist}
                />
            )}

            {detailsClientKey && (
                <ClientDetailsModal
                    client={getClientData(detailsClientKey)}
                    onClose={() => setDetailsClientKey(null)}
                />
            )}
        </div>
    );
}