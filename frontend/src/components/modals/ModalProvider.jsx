import React, { createContext, useCallback, useState } from 'react';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';

export const ModalContext = createContext(null);

export default function ModalProvider({ children }) {
    const [alertState, setAlertState] = useState(null);
    const [confirmState, setConfirmState] = useState(null);

    /**
     * Показать alert.
     * @param {string} message
     * @param {object|string} options — либо { type, title }, либо просто строка = type
     * @returns {Promise<void>}
     */
    const showAlert = useCallback((message, options = {}) => {
        const opts = typeof options === 'string'
            ? { type: options }
            : options;

        return new Promise((resolve) => {
            setAlertState({
                message,
                type: opts.type || 'info',
                title: opts.title,
                resolve,
            });
        });
    }, []);

    /**
     * Показать подтверждение.
     * @param {string} message
     * @param {object} options — { title, confirmText, cancelText, type }
     * @returns {Promise<boolean>}
     */
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
        </ModalContext.Provider>
    );
}