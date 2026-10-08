import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import styles from './BreaksEditor.module.css';

export default function BreaksEditor({ breaks, onChange }) {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValues, setEditValues] = useState({ start: '', end: '' });
    const [newBreak, setNewBreak] = useState(null);
    const { showAlert, showConfirm } = useModal();

    function handleEditClick(index) {
        setEditingIndex(index);
        setEditValues({
            start: breaks[index].start,
            end: breaks[index].end,
        });
    }

    function handleSaveEdit() {
        if (!editValues.start || !editValues.end) {
            showAlert('Заполните оба поля', 'warning');
            return;
        }
        if (editValues.start >= editValues.end) {
            showAlert('Время начала должно быть раньше времени окончания', 'warning');
            return;
        }

        const newBreaks = [...breaks];
        newBreaks[editingIndex] = { ...editValues };
        onChange(newBreaks);
        setEditingIndex(null);
    }

    function handleCancelEdit() {
        setEditingIndex(null);
    }

    async function handleDelete(index) {
        const ok = await showConfirm('Удалить этот перерыв?', { type: 'danger' });
        if (!ok) return;
        const newBreaks = breaks.filter((_, i) => i !== index);
        onChange(newBreaks);
    }

    function handleAdd() {
        setNewBreak({ start: '', end: '' });
    }

    function handleSaveNew() {
        if (!newBreak.start || !newBreak.end) {
            showAlert('Заполните оба поля', 'warning');
            return;
        }
        if (newBreak.start >= newBreak.end) {
            showAlert('Время начала должно быть раньше времени окончания', 'warning');
            return;
        }
        const newBreaks = [...breaks, newBreak];
        onChange(newBreaks);
        setNewBreak(null);
    }

    function handleCancelNew() {
        setNewBreak(null);
    }

    return (
        <div className={styles.editor}>
            <div className={styles.title}>Перерывы:</div>

            {breaks.map((br, index) => (
                <div key={index} className={styles.breakRow}>
                    <span className={styles.dot}>•</span>

                    {editingIndex === index ? (
                        <>
                            <input
                                type="time"
                                className={styles.input}
                                value={editValues.start}
                                onChange={e => setEditValues({ ...editValues, start: e.target.value })}
                            />
                            <span className={styles.separator}>—</span>
                            <input
                                type="time"
                                className={styles.input}
                                value={editValues.end}
                                onChange={e => setEditValues({ ...editValues, end: e.target.value })}
                            />
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                                onClick={handleSaveEdit}
                                title="Сохранить"
                            >
                                <i className="fas fa-check" />
                            </button>
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnSecondary}`}
                                onClick={handleCancelEdit}
                                title="Отмена"
                            >
                                <i className="fas fa-times" />
                            </button>
                        </>
                    ) : (
                        <>
                            <span className={styles.value}>{br.start} — {br.end}</span>
                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => handleEditClick(index)}
                                    title="Редактировать"
                                >
                                    <i className="fas fa-edit" />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                    onClick={() => handleDelete(index)}
                                    title="Удалить"
                                >
                                    <i className="fas fa-trash" />
                                </button>
                                {index === breaks.length - 1 && !newBreak && (
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={handleAdd}
                                        title="Добавить перерыв"
                                    >
                                        <i className="fas fa-plus" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            ))}

            {newBreak && (
                <div className={styles.breakRow}>
                    <span className={styles.dot}>•</span>
                    <input
                        type="time"
                        className={styles.input}
                        value={newBreak.start}
                        onChange={e => setNewBreak({ ...newBreak, start: e.target.value })}
                    />
                    <span className={styles.separator}>—</span>
                    <input
                        type="time"
                        className={styles.input}
                        value={newBreak.end}
                        onChange={e => setNewBreak({ ...newBreak, end: e.target.value })}
                    />
                    <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                        onClick={handleSaveNew}
                        title="Сохранить"
                    >
                        <i className="fas fa-check" />
                    </button>
                    <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnSecondary}`}
                        onClick={handleCancelNew}
                        title="Отмена"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
            )}

            {breaks.length === 0 && !newBreak && (
                <div className={styles.emptyRow}>
                    <span className={styles.dot}>•</span>
                    <span className={styles.emptyText}>Нет перерывов</span>
                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={handleAdd}
                        title="Добавить перерыв"
                    >
                        <i className="fas fa-plus" />
                    </button>
                </div>
            )}
        </div>
    );
}