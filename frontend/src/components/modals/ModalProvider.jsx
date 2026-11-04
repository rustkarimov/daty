import React, { createContext, useCallback, useState } from 'react';
import { createPortal } from 'react-dom'; // <--- ДОБАВИТЬ
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';

export const ModalContext = createContext(null);

export default function ModalProvider({ children }) {
    const [alertState, setAlertState] = useState(null);
    const [confirmState, setConfirmState] = useState(null);

    const showAlert = useCallback((message, options = {}) => {
        const opts = typeof options === 'string' ? { type: options } : options;
        return new Promise((resolve) => {
            setAlertState({
                message,
                type: opts.type || 'info',
                title: opts.title,
                resolve,
            });
        });
    }, []);

    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmState({
                message,
                title: options.title || 'Подтверждение',
                confirmText: options.confirmText || 'Да',
                cancelText: options.cancelText || 'Отмена',
                type: options.type || 'warning',
                resolve,
            });
        });
    }, []);

    const handleAlertClose = useCallback(() => {
        if (alertState?.resolve) alertState.resolve();
        setAlertState(null);
    }, [alertState]);

    const handleConfirmOk = useCallback(() => {
        if (confirmState?.resolve) confirmState.resolve(true);
        setConfirmState(null);
    }, [confirmState]);

    const handleConfirmCancel = useCallback(() => {
        if (confirmState?.resolve) confirmState.resolve(false);
        setConfirmState(null);
    }, [confirmState]);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}

            {/* Рендерим модалки через портал в document.body */}
            {createPortal(
                <>
                    {alertState && (
                        <AlertModal
                            message={alertState.message}
                            title={alertState.title}
                            type={alertState.type}
                            onClose={handleAlertClose}
                        />
                    )}
                    {confirmState && (
                        <ConfirmModal
                            message={confirmState.message}
                            title={confirmState.title}
                            confirmText={confirmState.confirmText}
                            cancelText={confirmState.cancelText}
                            type={confirmState.type}
                            onConfirm={handleConfirmOk}
                            onCancel={handleConfirmCancel}
                        />
                    )}
                </>,
                document.body
            )}
        </ModalContext.Provider>
    );
}