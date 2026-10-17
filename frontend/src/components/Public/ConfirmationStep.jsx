import React from 'react';
import styles from './ConfirmationStep.module.css';

const MONTH_NAMES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dObj = new Date(y, m - 1, d);
    return `${dObj.getDate()} ${MONTH_NAMES[dObj.getMonth()]}`;
}

export default function ConfirmationStep({
    result,
    isAway,
    selectedServices,
    selectedDate,
    selectedTime,
    clientAddress,
    onReset,
}) {
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    return (
        <div className="card mb-4">
            <div className="card-body text-center py-5">
                <i
                    className="fas fa-check-circle fa-4x mb-3"
                    style={{ color: isAway ? '#f59e0b' : '#28a745' }}
                />
                <h4 className={styles.title}>
                    {isAway ? 'Предварительная запись оформлена' : 'Запись подтверждена'}
                </h4>
                <p className={styles.subtitle}>
                    {isAway
                        ? 'Мастер получил заявку. Он свяжется с вами для подтверждения.'
                        : 'Ждём вас!'}
                </p>

                <div className={styles.details}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Дата</span>
                        <span>{formatDate(selectedDate)}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Время</span>
                        <span>{selectedTime}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Услуги</span>
                        <span>
                            {selectedServices.map((s, i) => (
                                <React.Fragment key={s.id}>
                                    {s.category_name ? `${s.category_name}: ` : ''}{s.name}
                                    {i < selectedServices.length - 1 && ', '}
                                </React.Fragment>
                            ))}
                        </span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Длительность</span>
                        <span>{totalDuration} мин</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Стоимость</span>
                        <span className={styles.price}>{totalPrice} ₽</span>
                    </div>
                    {isAway && clientAddress && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Адрес</span>
                            <span>{clientAddress}</span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="btn btn-pink mt-3"
                    onClick={onReset}
                >
                    Записаться ещё
                </button>
            </div>
        </div>
    );
}