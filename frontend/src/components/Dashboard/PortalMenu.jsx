import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PortalMenu({ anchorRef, onClose, children, styles }) {
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    useEffect(() => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            
            // Позиционируем под кнопкой
            let top = rect.bottom + 4;
            let left = rect.left;

            // Корректировка, чтобы не уйти за правый край
            if (left + 180 > window.innerWidth) {
                left = window.innerWidth - 190;
            }

            // Если меню не влезает вниз, открываем вверх
            if (rect.bottom + 250 > window.innerHeight) {
                top = rect.top - 250; // Примерная высота меню
            }

            setCoords({ top, left });
        }

        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [anchorRef, onClose]);

    return createPortal(
        <div
            ref={menuRef}
            className={styles.contactMenuPortal}
            style={{ top: coords.top, left: coords.left, position: 'fixed' }}
        >
            {children}
        </div>,
        document.body
    );
}