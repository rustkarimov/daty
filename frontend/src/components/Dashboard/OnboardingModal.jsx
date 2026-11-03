import React from 'react';
import { createPortal } from 'react-dom';
import useBodyLock from '../../hooks/useBodyLock';
import styles from './OnboardingModal.module.css';

export default function OnboardingModal({ onClose, hasServices, hasSchedule }) {
    useBodyLock();

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    let activeStep = 1;
    if (hasServices && !hasSchedule) activeStep = 2;
    if (hasServices && hasSchedule) activeStep = 3;

    const steps = [
        {
            id: 1,
            title: '1. Добавьте услуги',
            text: 'Перейдите в раздел «Услуги» и добавьте то, что вы делаете. Укажите длительность и цену.',
            icon: 'fa-cut',
            link: '/services/',
            linkText: 'Перейти к услугам',
            done: hasServices,
        },
        {
            id: 2,
            title: '2. Настройте расписание',
            text: 'В разделе «Расписание» укажите, в какие дни и часы вы работаете.',
            icon: 'fa-calendar-alt',
            link: '/schedule/',
            linkText: 'Настроить расписание',
            done: hasServices && hasSchedule,
        },
        {
            id: 3,
            title: '3. Отправьте ссылку клиентам',
            text: 'На главной странице скопируйте вашу личную ссылку и отправьте клиентам. Они смогут записаться сами!',
            icon: 'fa-link',
            link: '/dashboard/',
            linkText: 'Скопировать ссылку',
            done: hasServices && hasSchedule,
        },
    ];

    return createPortal(
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-graduation-cap" />
                        С чего начать?
                    </h5>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <p className={styles.intro}>
                        Мы подготовили 3 простых шага, чтобы вы могли начать принимать клиентов.
                    </p>

                    <div className={styles.stepsList}>
                        {steps.map((step) => {
                            const isCurrent = step.id === activeStep;
                            const isDone = step.done;

                            return (
                                <div 
                                    key={step.id} 
                                    className={`${styles.stepItem} ${isCurrent ? styles.stepCurrent : ''} ${isDone ? styles.stepDone : ''}`}
                                >
                                    <div className={`${styles.stepIcon} ${isDone ? styles.iconDone : ''}`}>
                                        {isDone ? (
                                            <i className="fas fa-check" />
                                        ) : (
                                            <i className={`fas ${step.icon}`} />
                                        )}
                                    </div>
                                    <div className={styles.stepContent}>
                                        <h6 className={styles.stepTitle}>{step.title}</h6>
                                        <p className={styles.stepText}>{step.text}</p>
                                        
                                        {!isDone && (
                                            <a href={step.link} className={styles.stepLink} onClick={onClose}>
                                                {step.linkText} <i className="fas fa-arrow-right" />
                                            </a>
                                        )}
                                        {isDone && (
                                            <span className={styles.stepDoneText}>Выполнено</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button type="button" className={styles.btnSecondary} onClick={onClose}>
                        Понятно
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}