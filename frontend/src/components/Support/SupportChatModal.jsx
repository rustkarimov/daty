import React, { useState, useEffect, useRef } from 'react';
import { loadMessages, sendMessage } from './api';
import { useSupport } from './SupportProvider';
import styles from './SupportChatModal.module.css';
import useBodyLock from '../../hooks/useBodyLock';

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

/**
 * Парсит строку `created_at` из API.
 * Формат: "HH:MM DD.MM.YYYY"
 * Возвращает { time, dateKey, dateLabel }.
 */
function parseCreatedAt(raw) {
    if (!raw) return { time: '', dateKey: '', dateLabel: '' };

    // "14:30 12.10.2026"
    const [time, dateStr] = raw.split(' ');
    if (!dateStr) return { time: raw, dateKey: '', dateLabel: '' };

    const [day, month, year] = dateStr.split('.').map(Number);
    const dateKey = `${year}-${month}-${day}`;
    const dateLabel = `${day} ${MONTH_NAMES[month - 1]} ${year}`;

    return { time, dateKey, dateLabel };
}

export default function SupportChatModal() {
    useBodyLock();
    const { closeModal, refreshUnreadCount } = useSupport();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const intervalRef = useRef(null);
    const isOpenRef = useRef(true);

    // ---- Первая загрузка ----

    useEffect(() => {
        loadMessages()
            .then(data => {
                if (data.success) {
                    setMessages(data.messages || []);
                    const msgs = data.messages || [];
                    lastMessageIdRef.current = msgs.length > 0 ? msgs[msgs.length - 1].id : null;
                    setLoading(false);
                    scrollToBottom();
                } else {
                    setLoading(false);
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки сообщений:', error);
                setLoading(false);
            });

        // Автообновление каждые 5 секунд
        intervalRef.current = setInterval(() => {
            if (isOpenRef.current) {
                pollMessages();
            }
        }, 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Автопрокрутка вниз при новых сообщениях ----

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    function scrollToBottom() {
        // Плавный скролл после рендера
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 50);
    }

    // ---- Опрос новых сообщений ----

    async function pollMessages() {
        try {
            const data = await loadMessages();
            if (!data.success) return;

            const newMessages = data.messages || [];

            if (newMessages.length === 0) return;

            const lastMsg = newMessages[newMessages.length - 1];

            // Если есть новые сообщения (id больше последнего)
            if (lastMsg.id !== lastMessageIdRef.current) {
                const trulyNew = newMessages.filter(m => m.id > (lastMessageIdRef.current || 0));
                if (trulyNew.length > 0) {
                    setMessages(newMessages);
                    lastMessageIdRef.current = lastMsg.id;
                } else {
                    // Ничего нового — просто обновим
                    setMessages(newMessages);
                }
            }
        } catch (error) {
            console.error('Ошибка опроса сообщений:', error);
        }
    }

    // ---- Отправка сообщения ----

    async function handleSend() {
        const text = inputText.trim();
        if (!text || sending) return;

        setSending(true);
        try {
            const data = await sendMessage(text);
            if (data.success) {
                setInputText('');
                // Загружаем свежие сообщения
                const fresh = await loadMessages();
                if (fresh.success) {
                    setMessages(fresh.messages || []);
                    const msgs = fresh.messages || [];
                    lastMessageIdRef.current = msgs.length > 0 ? msgs[msgs.length - 1].id : null;
                }
            } else {
                alert(data.error || 'Ошибка отправки');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения');
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // ---- Backdrop ----

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            closeModal();
            refreshUnreadCount();
        }
    }

    // ---- Рендер списка сообщений с разделителями дат ----

    function renderMessages() {
        if (messages.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <i className="fas fa-comment-dots" />
                    <p>Напишите свой вопрос, и мы обязательно поможем!</p>
                </div>
            );
        }

        const result = [];
        let lastDateKey = '';

        messages.forEach((msg, i) => {
            const { time, dateKey, dateLabel } = parseCreatedAt(msg.created_at);
            const isUser = msg.direction === 'user';

            // Разделитель даты
            if (dateKey !== lastDateKey) {
                result.push(
                    <div key={`date-${i}`} className={styles.dateSeparator}>
                        <div className={styles.dateLine} />
                        <div className={styles.dateLabel}>{dateLabel}</div>
                        <div className={styles.dateLine} />
                    </div>
                );
                lastDateKey = dateKey;
            }

            // Сообщение
            result.push(
                <div
                    key={`msg-${msg.id}`}
                    className={`${styles.messageRow} ${isUser ? styles.messageUser : styles.messageAdmin}`}
                >
                    {isUser ? (
                        <>
                            <div className={styles.messageTime}>{time}</div>
                            <div className={styles.messageBubbleUser}>{msg.message.trim()}</div>
                        </>
                    ) : (
                        <>
                            <div className={styles.messageBubbleAdmin}>{msg.message.trim()}</div>
                            <div className={styles.messageTime}>{time}</div>
                        </>
                    )}
                </div>
            );
        });

        return result;
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        <i className="fas fa-headset" />
                        Поддержка
                    </h5>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() => {
                            closeModal();
                            refreshUnreadCount();
                        }}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body} ref={messagesContainerRef}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className="spinner-border" style={{ color: 'var(--primary)' }} />
                        </div>
                    ) : (
                        <>
                            {renderMessages()}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <textarea
                        className={styles.textarea}
                        rows="2"
                        placeholder="Напишите свой вопрос..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                    />
                    <button
                        type="button"
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={sending || !inputText.trim()}
                    >
                        {sending ? (
                            <i className="fas fa-spinner fa-spin" />
                        ) : (
                            <i className="fas fa-paper-plane" />
                        )}
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    );
}