import { useContext } from 'react';
import { ModalContext } from '../components/modals/ModalProvider';

export default function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) {
        console.warn('useModal: ModalProvider не найден! Возвращаю fallback.');
        return {
            showAlert: (msg, type) => window.alert(msg),
            showConfirm: (msg) => window.confirm(msg),
        };
    }
    return ctx;
}