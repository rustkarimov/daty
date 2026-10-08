import React, { useState, useEffect } from 'react';
import useModal from '../../hooks/useModal';
import {
    addCategory,
    editCategory,
    deleteCategory,
} from '../../api/services';
import styles from './CategoryModal.module.css';

export default function CategoryModal({
    mode = 'add',
    category = null,
    categories = [],
    onClose,
    onSaved,
}) {
    const [formId, setFormId] = useState('');
    const [formName, setFormName] = useState('');
    const [formOrder, setFormOrder] = useState(0);
    const [saving, setSaving] = useState(false);

    // Inline-edit список
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [editingOrder, setEditingOrder] = useState(0);

    const { showAlert, showConfirm } = useModal();

    // Инициализация формы при открытии
    useEffect(() => {
        if (mode === 'edit' && category) {
            setFormId(category.id);
            setFormName(category.name);
            setFormOrder(category.order || 0);
        } else {
            setFormId('');
            setFormName('');
            setFormOrder(0);
        }
    }, [mode, category]);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    // ---------- Основная форма ----------

    async function handleSaveForm(e) {
        e.preventDefault();
        const name = formName.trim();
        if (!name) {
            showAlert('Введите название категории', 'warning');
            return;
        }

        setSaving(true);
        try {
            const payload = { name, order: parseInt(formOrder) || 0 };
            const data = formId
                ? await editCategory(formId, payload)
                : await addCategory(payload);

            if (data.success) {
                // Очищаем форму и остаёмся в модалке — чтобы можно было ещё добавлять
                setFormId('');
                setFormName('');
                setFormOrder(0);
                onSaved();
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

    function handleStartEdit(cat) {
        setEditingId(cat.id);
        setEditingName(cat.name);
        setEditingOrder(cat.order || 0);
    }

    function handleCancelEdit() {
        setEditingId(null);
        setEditingName('');
        setEditingOrder(0);
    }

    async function handleSaveInline(catId) {
        const name = editingName.trim();
        if (!name) {
            showAlert('Введите название', 'warning');
            return;
        }

        try {
            const data = await editCategory(catId, {
                name,
                order: parseInt(editingOrder) || 0,
            });
            if (data.success) {
                setEditingId(null);
                onSaved();
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        }
    }

    async function handleDelete(cat) {
        const ok = await showConfirm(
            `Удалить категорию "${cat.name}"?\nУслуги из этой категории будут перемещены в «Без категории».`,
            { type: 'danger' }
        );
        if (!ok) return;

        try {
            const data = await deleteCategory(cat.id);
            if (data.success) {
                onSaved();
            } else {
                showAlert(data.error || 'Ошибка удаления', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        }
    }

    // ---------- Заголовок модалки ----------

    const titleIcon = mode === 'edit' ? 'fa-edit' : 'fa-folder-plus';
    const titleText = mode === 'edit' ? 'Редактировать категорию' : 'Добавить категорию';

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
                    {/* ---- Форма добавления / редактирования ---- */}
                    <form className={styles.form} onSubmit={handleSaveForm}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Название категории</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Например: Маникюр, Педикюр, Уход"
                                autoFocus
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Порядок сортировки</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={formOrder}
                                onChange={e => setFormOrder(e.target.value)}
                                min="0"
                            />
                            <small className={styles.formHint}>
                                Чем меньше число, тем выше категория в списке
                            </small>
                        </div>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" />
                                    Сохранение...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check" />
                                    Сохранить категорию
                                </>
                            )}
                        </button>
                    </form>

                    {/* ---- Список существующих категорий ---- */}
                    <div className={styles.listBlock}>
                        <div className={styles.listTitle}>Другие категории</div>

                        {categories.length === 0 ? (
                            <div className={styles.emptyText}>У вас пока нет категорий</div>
                        ) : (
                            <div className={styles.list}>
                                {categories.map(cat => {
                                    const isEditing = editingId === cat.id;
                                    return (
                                        <div key={cat.id} className={styles.listItem}>
                                            {isEditing ? (
                                                <>
                                                    <div className={styles.editRow}>
                                                        <input
                                                            type="text"
                                                            className={styles.editName}
                                                            value={editingName}
                                                            onChange={e => setEditingName(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <input
                                                            type="number"
                                                            className={styles.editOrder}
                                                            value={editingOrder}
                                                            onChange={e => setEditingOrder(e.target.value)}
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className={styles.itemActions}>
                                                        <button
                                                            type="button"
                                                            className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                                                            onClick={() => handleSaveInline(cat.id)}
                                                            title="Сохранить"
                                                        >
                                                            <i className="fas fa-check" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.iconBtn}
                                                            onClick={handleCancelEdit}
                                                            title="Отмена"
                                                        >
                                                            <i className="fas fa-times" />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={styles.viewRow}>
                                                        <strong className={styles.viewName}>{cat.name}</strong>
                                                        <span className={styles.viewBadge}>
                                                            {cat.services.length} услуг
                                                        </span>
                                                        <span className={styles.viewOrder}>
                                                            порядок: {cat.order}
                                                        </span>
                                                    </div>
                                                    <div className={styles.itemActions}>
                                                        <button
                                                            type="button"
                                                            className={styles.iconBtn}
                                                            onClick={() => handleStartEdit(cat)}
                                                            title="Редактировать"
                                                        >
                                                            <i className="fas fa-edit" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                            onClick={() => handleDelete(cat)}
                                                            title="Удалить"
                                                        >
                                                            <i className="fas fa-trash" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button type="button" className={styles.btnSecondary} onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}