import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import { deleteCategory, deleteService } from '../../api/services';
import styles from './ServicesList.module.css';

export default function ServicesList({
    categories,
    uncategorized,
    onAddService,
    onAddServiceInCategory,
    onEditService,
    onEditCategory,
    onDataChanged,
}) {
    const [openCategories, setOpenCategories] = useState(new Set());
    const { showAlert, showConfirm } = useModal();

    const hasAnything = categories.length > 0 || uncategorized.length > 0;

    function toggleCategory(catId) {
        setOpenCategories(prev => {
            const next = new Set(prev);
            if (next.has(catId)) {
                next.delete(catId);
            } else {
                next.add(catId);
            }
            return next;
        });
    }

    async function handleDeleteCategory(cat) {
        const ok = await showConfirm(
            `Удалить категорию "${cat.name}"?\nУслуги из этой категории будут перемещены в «Без категории».`,
            { type: 'danger' }
        );
        if (!ok) return;

        try {
            const data = await deleteCategory(cat.id);
            if (data.success) {
                onDataChanged();
            } else {
                showAlert(data.error || 'Ошибка при удалении', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        }
    }

    async function handleDeleteService(service) {
        const ok = await showConfirm(
            `Удалить услугу "${service.name}"?`,
            { type: 'danger' }
        );
        if (!ok) return;

        try {
            const data = await deleteService(service.id);
            if (data.success) {
                onDataChanged();
            } else {
                showAlert(data.error || 'Ошибка при удалении', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        }
    }

    if (!hasAnything) {
        return (
            <div className={styles.emptyStateWrapper}>
                <div className={styles.emptyStateIcon}>
                    <i className="fas fa-cut" />
                </div>
                <h5 className={styles.emptyStateTitle}>У вас пока нет услуг</h5>
                <p className={styles.emptyStateDesc}>Добавьте первую услугу или категорию</p>
                
                <div className={styles.emptyStateBtnWrapper}>
                    <button type="button" className={styles.emptyStateBtn} onClick={onAddService}>
                        <i className="fas fa-plus" />
                        Добавить услугу
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {/* Категории с услугами */}
            {categories.map(cat => {
                const isOpen = openCategories.has(cat.id);
                const hasServices = cat.services.length > 0;

                return (
                    <div key={cat.id} className={styles.categoryCard}>
                        <div
                            className={styles.categoryHeader}
                            onClick={() => hasServices && toggleCategory(cat.id)}
                            style={{ cursor: hasServices ? 'pointer' : 'default' }}
                        >
                            <div className={styles.categoryTitle}>
                                <i
                                    className={`fas fa-chevron-right ${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                                />
                                <i className="fas fa-folder-open" />
                                <span>{cat.name}</span>
                                <span className={styles.badge}>{cat.services.length}</span>
                            </div>
                            <div
                                className={styles.categoryActions}
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => onAddServiceInCategory(cat.id)}
                                    title="Добавить услугу в эту категорию"
                                >
                                    <i className="fas fa-plus" />
                                </button>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => onEditCategory(cat)}
                                    title="Редактировать категорию"
                                >
                                    <i className="fas fa-edit" />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                    onClick={() => handleDeleteCategory(cat)}
                                    title="Удалить категорию"
                                >
                                    <i className="fas fa-trash" />
                                </button>
                            </div>
                        </div>

                        {hasServices && isOpen && (
                            <div className={styles.servicesGrid}>
                                {cat.services.map(service => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        onEdit={() => onEditService(service.id)}
                                        onDelete={() => handleDeleteService(service)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Услуги без категории */}
            {uncategorized.length > 0 && (() => {
                const isOpen = openCategories.has('uncategorized');
                const canCollapse = categories.length > 0;
                return (
                    <div className={styles.categoryCard}>
                        <div
                            className={styles.categoryHeader}
                            onClick={canCollapse ? () => toggleCategory('uncategorized') : undefined}
                            style={{ cursor: canCollapse ? 'pointer' : 'default' }}
                        >
                            <div className={styles.categoryTitle}>
                                {canCollapse && (
                                    <i
                                        className={`fas fa-chevron-right ${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                                    />
                                )}
                                <i className="fas fa-tag" />
                                <span>Без категории</span>
                                <span className={styles.badge}>{uncategorized.length}</span>
                            </div>
                        </div>
                        {(!canCollapse || isOpen) && (
                            <div className={styles.servicesGrid}>
                                {uncategorized.map(service => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        onEdit={() => onEditService(service.id)}
                                        onDelete={() => handleDeleteService(service)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

// ---------- Карточка услуги ----------

function ServiceCard({ service, onEdit, onDelete }) {
    const isInactive = service.is_active === false;

    return (
        <div className={`${styles.serviceCard} ${isInactive ? styles.serviceCardInactive : ''}`}>
            <div className={styles.serviceName}>{service.name}</div>

            {service.description && (
                <div className={styles.serviceDescription}>{service.description}</div>
            )}

            <div className={styles.serviceMeta}>
                <span className={styles.serviceDuration}>
                    <i className="far fa-clock" />
                    {service.duration} мин
                </span>
                <span className={styles.servicePrice}>{service.price} ₽</span>
            </div>

            <div className={styles.serviceActions}>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onEdit}
                    title="Редактировать"
                >
                    <i className="fas fa-edit" />
                </button>
                <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={onDelete}
                    title="Удалить"
                >
                    <i className="fas fa-trash" />
                </button>
            </div>
        </div>
    );
}