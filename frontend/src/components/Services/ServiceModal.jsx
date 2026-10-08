import React, { useState, useEffect } from 'react';
import useModal from '../../hooks/useModal';
import { getService, addService, editService } from '../../api/services';
import styles from './ServiceModal.module.css';

export default function ServiceModal({
    mode = 'add',
    serviceId = null,
    categories = [],
    onClose,
    onSaved,
}) {
    const [loading, setLoading] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);
    const { showAlert } = useModal();

    // Поля формы
    const [formCategoryId, setFormCategoryId] = useState('');
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formDuration, setFormDuration] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);

    // ---------- Загрузка услуги при редактировании ----------

    useEffect(() => {
        if (mode !== 'edit' || !serviceId) return;

        setLoading(true);
        getService(serviceId)
            .then(response => {
                if (!response.success) {
                    showAlert(response.error || 'Ошибка загрузки услуги', 'error');
                    onClose();
                    return;
                }
                const service = response.data;
                setFormCategoryId(service.category_id || '');
                setFormName(service.name || '');
                setFormDescription(service.description || '');
                setFormDuration(service.duration || '');
                setFormPrice(service.price || '');
                setFormIsActive(service.is_active !== false);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showAlert('Ошибка соединения', 'error');
                onClose();
            });
    }, [mode, serviceId, showAlert, onClose]);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    // ---------- Сохранение ----------

    async function handleSave(e) {
        e.preventDefault();

        const name = formName.trim();
        const duration = parseInt(formDuration);
        const price = parseFloat(formPrice);

        if (!name) {
            showAlert('Введите название услуги', 'warning');
            return;
        }
        if (!duration || duration < 5) {
            showAlert('Длительность должна быть не меньше 5 минут', 'warning');
            return;
        }
        if (isNaN(price) || price < 0) {
            showAlert('Введите корректную цену', 'warning');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name,
                description: formDescription.trim(),
                duration,
                price,
                is_active: formIsActive,
                category_id: formCategoryId || null,
            };

            const data = mode === 'edit'
                ? await editService(serviceId, payload)
                : await addService(payload);

            if (data.success) {
                onSaved();
                onClose();
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSaving(false);
        }
    }

    // ---------- Заголовок ----------

    const titleIcon = mode === 'edit' ? 'fa-edit' : 'fa-plus';
    const titleText = mode === 'edit' ? 'Редактировать услугу' : 'Добавить услугу';

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className={`fas ${titleIcon}`} />
                        {titleText}
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
                            <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                        </div>
                    ) : (
                        <form id="service-form" onSubmit={handleSave}>
                            {/* Категория */}
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Категория</label>
                                <select
                                    className={styles.formSelect}
                                    value={formCategoryId}
                                    onChange={e => setFormCategoryId(e.target.value)}
                                >
                                    <option value="">— Без категории —</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Название */}
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>
                                    Название услуги <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder="Например: Классический маникюр"
                                    autoFocus
                                />
                            </div>

                            {/* Описание */}
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Описание</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                    rows="3"
                                    placeholder="Необязательно"
                                />
                            </div>

                            {/* Длительность + Цена — в две колонки */}
                            <div className={styles.row}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>
                                        Длительность (мин) <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={formDuration}
                                        onChange={e => setFormDuration(e.target.value)}
                                        min="5"
                                        step="5"
                                        placeholder="60"
                                    />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>
                                        Цена (₽) <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={formPrice}
                                        onChange={e => setFormPrice(e.target.value)}
                                        min="0"
                                        step="50"
                                        placeholder="1500"
                                    />
                                </div>
                            </div>

                            {/* Активна */}
                            <div className={styles.checkboxField}>
                                <input
                                    type="checkbox"
                                    id="service-active"
                                    className={styles.checkboxInput}
                                    checked={formIsActive}
                                    onChange={e => setFormIsActive(e.target.checked)}
                                />
                                <label htmlFor="service-active" className={styles.checkboxLabel}>
                                    Активна
                                </label>
                                <span className={styles.checkboxHint}>
                                    Неактивные услуги не видны клиентам
                                </span>
                            </div>
                        </form>
                    )}
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        form="service-form"
                        className={styles.btnPrimary}
                        disabled={saving || loading}
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                Сохранение...
                            </>
                        ) : (
                            'Сохранить'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}