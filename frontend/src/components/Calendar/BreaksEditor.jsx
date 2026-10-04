import React, { useState } from 'react';

export default function BreaksEditor({ breaks, onChange }) {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValues, setEditValues] = useState({ start: '', end: '' });
    const [newBreak, setNewBreak] = useState(null);  // ← для нового перерыва

    function handleEditClick(index) {
        setEditingIndex(index);
        setEditValues({
            start: breaks[index].start,
            end: breaks[index].end,
        });
    }

    function handleSaveEdit() {
        if (!editValues.start || !editValues.end) {
            alert('Заполните оба поля');
            return;
        }
        if (editValues.start >= editValues.end) {
            alert('Время начала должно быть раньше времени окончания');
            return;
        }

        const newBreaks = [...breaks];
        newBreaks[editingIndex] = { ...editValues };
        onChange(newBreaks);  // ← сохраняем на сервер
        setEditingIndex(null);
    }

    function handleCancelEdit() {
        setEditingIndex(null);
    }

    function handleDelete(index) {
        if (!confirm('Удалить этот перерыв?')) return;
        const newBreaks = breaks.filter((_, i) => i !== index);
        onChange(newBreaks);  // ← сохраняем на сервер
    }

    function handleAdd() {
        setNewBreak({ start: '', end: '' });  // ← показываем форму
    }

    function handleSaveNew() {
        if (!newBreak.start || !newBreak.end) {
            alert('Заполните оба поля');
            return;
        }
        if (newBreak.start >= newBreak.end) {
            alert('Время начала должно быть раньше времени окончания');
            return;
        }
        const newBreaks = [...breaks, newBreak];
        onChange(newBreaks);  // ← сохраняем на сервер
        setNewBreak(null);
    }

    function handleCancelNew() {
        setNewBreak(null);
    }

    return (
        <div className="breaks-editor">
            <div className="d-flex align-items-center gap-2 mb-2">
                <strong style={{ fontSize: '0.9rem' }}>Перерывы:</strong>
            </div>

            {breaks.length === 0 && !newBreak && (
                <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    Нет перерывов
                </p>
            )}

            {breaks.map((br, index) => (
                <div key={index} className="break-row mb-2">
                    {editingIndex === index ? (
                        <div className="d-flex align-items-center gap-2">
                            <input
                                type="time"
                                className="form-control form-control-sm"
                                style={{ width: '110px' }}
                                value={editValues.start}
                                onChange={e => setEditValues({ ...editValues, start: e.target.value })}
                            />
                            <span>—</span>
                            <input
                                type="time"
                                className="form-control form-control-sm"
                                style={{ width: '110px' }}
                                value={editValues.end}
                                onChange={e => setEditValues({ ...editValues, end: e.target.value })}
                            />
                            <button
                                className="btn btn-sm btn-outline-success"
                                onClick={handleSaveEdit}
                                title="Сохранить"
                            >
                                <i className="fas fa-check" />
                            </button>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={handleCancelEdit}
                                title="Отмена"
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    ) : (
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '0.9rem' }}>
                                {br.start} — {br.end}
                            </span>
                            <button
                                className="btn btn-sm"
                                onClick={() => handleEditClick(index)}
                                title="Редактировать"
                            >
                                <i className="fas fa-edit" />
                            </button>
                            <button
                                className="btn btn-sm"
                                onClick={() => handleDelete(index)}
                                title="Удалить"
                            >
                                <i className="fas fa-trash" />
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {newBreak ? (
                <div className="d-flex align-items-center gap-2 mb-2">
                    <input
                        type="time"
                        className="form-control form-control-sm"
                        style={{ width: '110px' }}
                        value={newBreak.start}
                        onChange={e => setNewBreak({ ...newBreak, start: e.target.value })}
                    />
                    <span>—</span>
                    <input
                        type="time"
                        className="form-control form-control-sm"
                        style={{ width: '110px' }}
                        value={newBreak.end}
                        onChange={e => setNewBreak({ ...newBreak, end: e.target.value })}
                    />
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={handleSaveNew}
                        title="Сохранить"
                    >
                        <i className="fas fa-check" />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleCancelNew}
                        title="Отмена"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
            ) : (
                <button
                    className="btn btn-sm btn-outline-primary mt-2"
                    onClick={handleAdd}
                >
                    <i className="fas fa-plus me-1" />
                    Добавить перерыв
                </button>
            )}
        </div>
    );
}