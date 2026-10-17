import React, { useState, useEffect } from 'react';
import { loadMasterCategories } from '../../api/publicBooking';
import useModal from '../../hooks/useModal';
import styles from './ServicesStep.module.css';

export default function ServicesStep({ identifier, selectedServices, onChange }) {
    const [categories, setCategories] = useState([]);
    const [uncategorized, setUncategorized] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openCategories, setOpenCategories] = useState(new Set());
    const { showAlert } = useModal();

    useEffect(() => {
        loadMasterCategories(identifier)
            .then(data => {
                setCategories(data.categories || []);
                setUncategorized(data.uncategorized || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки услуг:', error);
                setLoading(false);
            });
    }, [identifier]);

    function isSelected(serviceId) {
        return selectedServices.some(s => s.id === serviceId);
    }

    function toggleService(service, categoryName) {
        if (isSelected(service.id)) {
            const newList = selectedServices.filter(s => s.id !== service.id);
            onChange(newList);
        } else {
            if (selectedServices.length >= 3) {
                showAlert('Можно выбрать не более 3 услуг', 'warning');
                return;
            }
            const newList = [...selectedServices, {
                ...service,
                category_name: categoryName,
            }];
            onChange(newList);
        }
    }

    function toggleCategory(catId) {
        setOpenCategories(prev => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId);
            else next.add(catId);
            return next;
        });
    }

    function scrollToCategory(catId) {
        const el = document.getElementById(catId);
        if (el) {
            const offset = 80;
            const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }

    function renderServiceCard(service, categoryName) {
        const selected = isSelected(service.id);
        return (
            <div className="col-md-6 mb-3" key={service.id}>
                <div
                    className={`${styles.serviceCard} ${selected ? styles.selected : ''}`}
                    onClick={() => toggleService(service, categoryName)}
                >
                    {selected && (
                        <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={e => {
                                e.stopPropagation();
                                toggleService(service, categoryName);
                            }}
                            aria-label="Убрать услугу"
                        >
                            ✕
                        </button>
                    )}
                    <div className={styles.serviceHeader}>
                        <div>
                            <div className={styles.serviceName}>{service.name}</div>
                            {service.description && (
                                <div className={styles.serviceDesc}>{service.description}</div>
                            )}
                        </div>
                        <span className={styles.servicePrice}>{service.price} ₽</span>
                    </div>
                    <div className={styles.serviceMeta}>
                        <i className="far fa-clock me-1" />
                        {service.duration} мин
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card mb-4">
                <div className="card-body">
                    <div className="text-center py-3">
                        <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card mb-4">
            <div className="card-header bg-white">
                <h5 className="mb-0">
                    <i className="fas fa-cut me-2" style={{ color: 'var(--primary)' }} />
                    Шаг 1: Выберите услуги (можно несколько, до 3)
                </h5>
            </div>
            <div className="card-body">
                {/* Якоря */}
                {categories.length > 0 && (
                    <div className={styles.anchors}>
                        {categories.filter(c => c.services.length > 0).map(cat => (
                            <a
                                key={cat.id}
                                className={styles.anchor}
                                onClick={() => scrollToCategory(`cat-${cat.id}`)}
                            >
                                {cat.name}
                            </a>
                        ))}
                    </div>
                )}

                {/* Категории */}
                {categories.map(cat => {
                    if (cat.services.length === 0) return null;
                    const isOpen = openCategories.has(cat.id);
                    return (
                        <div key={cat.id} id={`cat-${cat.id}`} className={styles.categoryGroup}>
                            <div
                                className={styles.categoryTitle}
                                onClick={() => toggleCategory(cat.id)}
                            >
                                <i
                                    className={`fas fa-chevron-right ${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                                />
                                <i className="fas fa-folder-open me-1" style={{ color: 'var(--primary)', fontSize: '0.7rem' }} />
                                {cat.name}
                                <span className={styles.badge}>{cat.services.length}</span>
                            </div>
                            <div className="row" style={{ display: isOpen ? 'flex' : 'none' }}>
                                {cat.services.map(s => renderServiceCard(s, cat.name))}
                            </div>
                        </div>
                    );
                })}

                {/* Без категории */}
                {uncategorized.length > 0 && (
                    <div className={styles.categoryGroup}>
                        <div className={styles.categoryTitle} style={{ cursor: 'default' }}>
                            <i className="fas fa-tag me-1" style={{ color: 'var(--gray-400)', fontSize: '0.7rem' }} />
                            Без категории
                            <span className={styles.badge}>{uncategorized.length}</span>
                        </div>
                        <div className="row">
                            {uncategorized.map(s => renderServiceCard(s, null))}
                        </div>
                    </div>
                )}

                {/* Итого */}
                {selectedServices.length > 0 && (
                    <div className={styles.summary}>
                        <div className={styles.summaryTitle}>
                            <i className="fas fa-list me-1" />
                            Выбрано ({selectedServices.length}):
                        </div>
                        {selectedServices.map((s) => (
                            <div key={s.id} className={styles.summaryItem}>
                                <span>
                                    {s.category_name ? `${s.category_name}: ` : ''}{s.name}
                                </span>
                                <div className={styles.summaryMeta}>
                                    <span>{s.duration} мин</span>
                                    <span>{s.price} ₽</span>
                                    <button
                                        type="button"
                                        className={styles.removeBtn}
                                        onClick={() => toggleService(s, s.category_name)}
                                        aria-label="Убрать"
                                    >
                                        <i className="fas fa-times" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className={styles.summaryTotal}>
                            <span>Итого</span>
                            <span>
                                {selectedServices.reduce((sum, s) => sum + s.duration, 0)} мин / {' '}
                                {selectedServices.reduce((sum, s) => sum + s.price, 0)} ₽
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}