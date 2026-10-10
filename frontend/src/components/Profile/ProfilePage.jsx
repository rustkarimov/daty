import React, { useState, useRef } from 'react';
import useModal from '../../hooks/useModal';
import { updateProfile, uploadAvatar } from '../../api/profile';
import styles from './ProfilePage.module.css';

export default function ProfilePage({ initialData, masterId }) {
    const [firstName, setFirstName] = useState(initialData.first_name || '');
    const [lastName, setLastName] = useState(initialData.last_name || '');
    const [login, setLogin] = useState(initialData.login || '');
    const [address, setAddress] = useState(initialData.address || '');
    const [bio, setBio] = useState(initialData.bio || '');

    const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url || null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef(null);
    const { showAlert } = useModal();

    const avatarPlaceholder = (firstName?.[0] || initialData.phone?.[0] || 'U').toUpperCase();

    // ---------- Аватар ----------

    function handleAvatarClick() {
        fileInputRef.current?.click();
    }

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showAlert('Выберите изображение', 'warning');
            return;
        }

        setUploadingAvatar(true);
        try {
            const data = await uploadAvatar(file);
            if (data.success) {
                setAvatarUrl(`${data.avatar_url}?t=${Date.now()}`);
                showAlert('Аватар загружен!', 'success');
            } else {
                showAlert(data.error || 'Ошибка загрузки', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    }

    // ---------- Сохранение профиля ----------

    async function handleSubmit(e) {
        e.preventDefault();

        setSaving(true);
        try {
            const data = await updateProfile({
                first_name: firstName,
                last_name: lastName,
                login: login,
                address: address,
                bio: bio,
            });

            if (data.success) {
                showAlert('Профиль сохранён', 'success');
                // Обновляем URL, если логин изменился
                if (data.master?.public_slug) {
                    // Просто обновляем браузерный title без перезагрузки
                    document.title = `${firstName} ${lastName} - Профиль`;
                }
            } else {
                showAlert(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
        } finally {
            setSaving(false);
        }
    }

    // ---------- Ссылка ----------

    const publicSlug = login || `id${masterId}`;
    const publicUrl = `${window.location.origin}/${publicSlug}/`;

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <h2>Профиль</h2>
            </div>

            <div className={styles.card}>
                <div className={styles.cardBody}>
                    {/* Аватар */}
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarPreview}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Аватар"
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {avatarPlaceholder}
                                </div>
                            )}
                        </div>

                        <div className={styles.avatarUpload}>
                            <button
                                type="button"
                                className={styles.btnOutline}
                                onClick={handleAvatarClick}
                                disabled={uploadingAvatar}
                            >
                                <i className="fas fa-camera" />
                                {uploadingAvatar ? 'Загрузка...' : 'Загрузить фото'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                            <small className={styles.hint}>
                                Поддерживаются любые форматы
                            </small>
                        </div>
                    </div>

                    {/* Форма */}
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Телефон</label>
                            <input
                                type="tel"
                                className={styles.formInput}
                                value={initialData.phone || ''}
                                disabled
                            />
                            <small className={styles.hint}>
                                Телефон используется для входа и не может быть изменён
                            </small>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Имя</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Фамилия</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Логин (для красивой ссылки)</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={login}
                                onChange={e => setLogin(e.target.value)}
                            />
                            <small className={styles.hint}>
                                Ваша ссылка: <span className={styles.linkPreview}>{publicUrl}</span>
                            </small>
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Адрес</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Например: Москва, ул. Тверская 15"
                            />
                            <small className={styles.hint}>Ваш адрес для клиентов</small>
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>О себе</label>
                            <textarea
                                className={styles.formTextarea}
                                rows="4"
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="submit"
                                className={styles.btnPrimary}
                                disabled={saving}
                            >
                                {saving ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}