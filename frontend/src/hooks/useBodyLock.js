// frontend/src/hooks/useBodyLock.js
import { useEffect } from 'react';

// Глобальный счётчик открытых модалок.
// Пока хотя бы одна модалка открыта — body заблокирован (overflow: hidden).
let lockCount = 0;
let originalOverflow = '';

export default function useBodyLock() {
    useEffect(() => {
        if (lockCount === 0) {
            originalOverflow = document.body.style.overflow || '';
            document.body.style.overflow = 'hidden';
        }
        lockCount += 1;

        return () => {
            lockCount -= 1;
            if (lockCount === 0) {
                document.body.style.overflow = originalOverflow;
            }
        };
    }, []);
}