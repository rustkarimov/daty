// frontend/src/components/Dashboard/Calendar/ServiceCards.jsx
//
// Сетка карточек услуг, сгруппированных по категориям.
// Используется в AddBookingModal, EditBookingModal, ClientFormStep.

import React from 'react';
import shared from './BookingModalShared.module.css';

/**
 * @param {Object} props
 * @param {Array} props.categories — [{ id, name, services: [...] }]
 * @param {Array} props.uncategorized — [{ id, name, ... }]
 * @param {Array<number>} props.selectedIds — id выбранных услуг
 * @param {Function} props.onToggle — (service) => void
 * @param {boolean} props.showCloseButton — показывать крестик у выбранной
 */
export default function ServiceCards({
    categories,
    uncategorized,
    selectedIds,
    onToggle,
    showCloseButton = false,
}) {
    const selectedSet = new Set(selectedIds || []);

    function renderServiceCard(s, categoryName) {
        const selected = selectedSet.has(s.id);
        return (
            <div
                key={s.id}
                className={`${shared.serviceCard} ${selected ? shared.serviceCardSelected : ''}`}
                onClick={() => onToggle({ ...s, category_name: categoryName })}
            >
                {selected && showCloseButton && (
                    <button
                        type="button"
                        className={shared.serviceCloseBtn}
                        onClick={e => {
                            e.stopPropagation();
                            onToggle({ ...s, category_name: categoryName });
                        }}
                        aria-label="Убрать услугу"
                    >
                        ✕
                    </button>
                )}
                <div className={shared.serviceCardHeader}>
                    <div className={shared.serviceCardName}>{s.name}</div>
                    <span className={shared.serviceCardPrice}>{s.price} ₽</span>
                </div>
                <div className={shared.serviceCardMeta}>
                    <i className="far fa-clock me-1" />
                    {s.duration} мин
                </div>
            </div>
        );
    }

    return (
        <>
            {categories.map(cat => (
                <div key={cat.id} style={{ marginBottom: '12px' }}>
                    <div className={shared.categoryLabel}>{cat.name}</div>
                    <div className={shared.grid}>
                        {cat.services.map(s => renderServiceCard(s, cat.name))}
                    </div>
                </div>
            ))}

            {uncategorized.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                    <div className={shared.categoryLabel}>Без категории</div>
                    <div className={shared.grid}>
                        {uncategorized.map(s => renderServiceCard(s, null))}
                    </div>
                </div>
            )}
        </>
    );
}