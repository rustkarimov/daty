import React, { useState } from 'react';
import useModal from '../../hooks/useModal';
import styles from './PublicLinkCard.module.css';

export default function PublicLinkCard({ publicLink }) {
    const [copied, setCopied] = useState(false);
    const { showAlert } = useModal();

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(publicLink);
            setCopied(true);
            showAlert('Ссылка скопирована!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Ошибка копирования:', error);
            showAlert('Не удалось скопировать ссылку', 'error');
        }
    }

    return (
        <div className="card mb-4">
            <div className="card-body">
                <h5>
                    <i className="fas fa-share-alt me-2" style={{ color: 'var(--primary)' }} />
                    Твоя страница для записи
                </h5>

                {/* Десктоп: input + кнопка в одну строку */}
                <div className={styles.desktop}>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            value={publicLink}
                            readOnly
                            onFocus={e => e.target.select()}
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCopy}
                        >
                            <i className="fas fa-copy" /> Копировать
                        </button>
                    </div>
                </div>

                {/* Мобильный: input сверху, кнопка снизу */}
                <div className={styles.mobile}>
                    <input
                        type="text"
                        className="form-control mb-2"
                        value={publicLink}
                        readOnly
                        onFocus={e => e.target.select()}
                    />
                    <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleCopy}
                    >
                        <i className="fas fa-copy me-2" />
                        Копировать ссылку
                    </button>
                </div>

                <small className="text-muted d-block mt-2">
                    Отправь эту ссылку клиентам, и они смогут записаться
                </small>
            </div>
        </div>
    );
}