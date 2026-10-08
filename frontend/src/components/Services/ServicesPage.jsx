import React, { useState, useEffect, useCallback } from 'react';
import ServicesList from './ServicesList';
import CategoryModal from './CategoryModal';
// import ServiceModal from './ServiceModal';
import useModal from '../../hooks/useModal';
import { loadCategories } from '../../api/services';
import styles from './ServicesPage.module.css';

export default function ServicesPage() {
    const [categories, setCategories] = useState([]);
    const [uncategorized, setUncategorized] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryModal, setCategoryModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', category: {...} }
    const [serviceModal, setServiceModal] = useState(null);   // null | { mode: 'add' } | { mode: 'edit', serviceId: number }
    const { showAlert } = useModal();

    const reloadData = useCallback(() => {
        setLoading(true);
        loadCategories()
            .then(data => {
                setCategories(data.categories || []);
                setUncategorized(data.uncategorized || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки категорий:', error);
                setLoading(false);
                showAlert('Не удалось загрузить услуги', 'error');
            });
    }, [showAlert]);

    useEffect(() => {
        reloadData();
    }, [reloadData]);

    // ---------- Обработчики открытия модалок ----------

    function openAddCategory() {
        setCategoryModal({ mode: 'add' });
    }

    function openEditCategory(category) {
        setCategoryModal({ mode: 'edit', category });
    }

    function openAddService() {
        setServiceModal({ mode: 'add' });
    }

    function openEditService(serviceId) {
        setServiceModal({ mode: 'edit', serviceId });
    }

    function closeCategoryModal() {
        setCategoryModal(null);
    }

    function closeServiceModal() {
        setServiceModal(null);
    }

    function handleDataChanged() {
        reloadData();
    }

    return (
        <div className={styles.page}>
            {/* Заголовок */}
            <div className={styles.pageHeader}>
                <h2>Мои услуги</h2>
            </div>

            {/* Кнопки действий */}
            <div className={styles.actionsBar}>
                <button
                    type="button"
                    className={styles.btnOutline}
                    onClick={openAddCategory}
                >
                    <i className="fas fa-folder-plus" />
                    Добавить категорию
                </button>
                <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={openAddService}
                >
                    <i className="fas fa-plus" />
                    Добавить услугу
                </button>
            </div>

            {/* Список категорий + услуг */}
            {loading ? (
                <div className={styles.loading}>
                    <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                </div>
            ) : (
                <ServicesList
                    categories={categories}
                    uncategorized={uncategorized}
                    onAddService={openAddService}
                    onEditService={openEditService}
                    onEditCategory={openEditCategory}
                    onDataChanged={handleDataChanged}
                />
            )}

            {/* Модалка категории */}
            {categoryModal && (
                <CategoryModal
                    mode={categoryModal.mode}
                    category={categoryModal.category}
                    categories={categories}
                    onClose={closeCategoryModal}
                    onSaved={handleDataChanged}
                />
            )}

            {/* Модалка услуги */}
            {serviceModal && (
                <ServiceModal
                    mode={serviceModal.mode}
                    serviceId={serviceModal.serviceId}
                    categories={categories}
                    onClose={closeServiceModal}
                    onSaved={handleDataChanged}
                />
            )}
        </div>
    );
}