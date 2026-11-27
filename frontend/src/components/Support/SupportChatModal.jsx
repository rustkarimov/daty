import React, { useState, useEffect, useRef } from 'react';
import { loadMessages, sendMessage, deleteMessage } from './api'; // ← добавили deleteMessage
import { useSupport } from './SupportProvider';
import styles from './SupportChatModal.module.css';
import useBodyLock from '../../hooks/useBodyLock';
import useModal from '../../hooks/useModal'; // ← для подтверждения удаления

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

function parseCreatedAt(raw) {
    if (!raw) return { time: '', dateKey: '', dateLabel: '' };
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
    const { showConfirm } = useModal();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const intervalRef = useRef(null);

    // Автоувеличение высоты textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`; // Максимум ~4 строки
        }
    }, [inputText]);

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

        intervalRef.current = setInterval(() => {
            pollMessages();
        }, 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    function scrollToBottom() {
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 50);
    }

    async function pollMessages() {
        try {
            const data = await loadMessages();
            if (!data.success) return;
            const newMessages = data.messages || [];
            if (newMessages.length === 0) return;
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.id !== lastMessageIdRef.current) {
                const trulyNew = newMessages.filter(m => m.id > (lastMessageIdRef.current || 0));
                if (trulyNew.length > 0) {
                    setMessages(newMessages);
                    lastMessageIdRef.current = lastMsg.id;
                } else {
                    setMessages(newMessages);
                }
            }
        } catch (error) {
            console.error('Ошибка опроса сообщений:', error);
        }
    }

    async function handleSend() {
        const text = inputText.trim();
        if ((!text && !selectedImage) || sending) return;

        setSending(true);
        try {
            const data = await sendMessage(text, selectedImage);
            if (data.success) {
                setInputText('');
                setSelectedImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
                
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

    async function handleDelete(msgId) {
        const ok = await showConfirm('Удалить это сообщение?', { type: 'danger' });
        if (!ok) return;

        try {
            const data = await deleteMessage(msgId);
            if (data.success) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
            } else {
                alert(data.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения');
        }
    }

    // Enter больше не отправляет (только перенос строки)
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Ничего не делаем, разрешаем браузеру вставить перенос строки
        }
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            closeModal();
            refreshUnreadCount();
        }
    }

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
            
            const hasText = msg.message && msg.message.trim() !== '' && msg.message !== '📷 Изображение';
            const hasImage = !!msg.image_url;

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

            const messageContent = (
                <>
                    {hasImage && (
                        <img 
                            src={msg.image_url} 
                            alt="Вложение" 
                            className={`${styles.messageImage} ${hasText ? styles.messageImageWithGap : ''}`} 
                        />
                    )}
                    {hasText && <div>{msg.message.trim()}</div>}
                </>
            );

            result.push(
                <div
                    key={`msg-${msg.id}`}
                    className={`${styles.messageRow} ${isUser ? styles.messageUser : styles.messageAdmin}`}
                >
                    {isUser ? (
                        <>
                            <div className={styles.messageTime}>{time}</div>
                            <div className={styles.messageBubbleUser}>
                                {messageContent}
                                {/* Кнопка удаления (только для своих) */}
                                <button 
                                    className={styles.deleteMsgBtn}
                                    onClick={() => handleDelete(msg.id)}
                                    title="Удалить сообщение"
                                >
                                    <i className="fas fa-trash" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.messageBubbleAdmin}>
                                {messageContent}
                            </div>
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
                    {selectedImage && (
                        <div className={styles.imagePreviewWrapper}>
                            <img 
                                src={URL.createObjectURL(selectedImage)} 
                                alt="Превью" 
                                className={styles.imagePreview} 
                            />
                            <button 
                                onClick={() => { setSelectedImage(null); fileInputRef.current.value = ''; }}
                                className={styles.removeImageBtn}
                                title="Удалить фото"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className={styles.inputContainer}>
                        <textarea
                            ref={textareaRef}
                            className={styles.textarea}
                            rows="1"
                            placeholder="Напишите свой вопрос..."
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={sending}
                        />
                        
                        <div className={styles.actionButtons}>
                            <input 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                ref={fileInputRef}
                                onChange={(e) => setSelectedImage(e.target.files[0])}
                            />
                            <button 
                                type="button" 
                                className={styles.attachBtn} 
                                onClick={() => fileInputRef.current?.click()}
                                title="Прикрепить картинку"
                            >
                                <i className="fas fa-paperclip" />
                            </button>
                            
                            <button
                                type="button"
                                className={styles.sendBtn}
                                onClick={handleSend}
                                disabled={sending || (!inputText.trim() && !selectedImage)}
                                title="Отправить"
                            >
                                {sending ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}