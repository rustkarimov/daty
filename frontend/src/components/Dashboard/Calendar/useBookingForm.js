// frontend/src/components/Dashboard/Calendar/useBookingForm.js
//
// Общий хук для AddBookingModal, EditBookingModal, ClientFormStep.
// Управляет состоянием формы бронирования, загрузкой данных и сохранением.
//
// mode:
//   'add'    — создание записи мастером (AddBookingModal)
//   'edit'   — редактирование записи (EditBookingModal)
//   'client' — создание записи клиентом (ClientFormStep)

import { useState, useEffect, useCallback } from 'react';
import {
    loadMasterCategories,
    loadAvailableDates,
    createMultipleBookings,
} from '../../../api/booking';
import { createBookings } from '../../../api/publicBooking';
import { loadBookingForEdit, updateBooking, loadDayStatus } from '../../../api/day';
import { phoneMask } from '../../../utils/phoneMask';
import useModal from '../../../hooks/useModal';

const MAX_SERVICES_ADD = 3;

export default function useBookingForm({
    mode = 'add',
    masterSlug,
    masterMode = 'home',
    bookingId = null,
    defaultDate = '',
    defaultTime = '',
    // Для edit:
    initialStatus = 'confirmed',
    initialServiceId = null,
    initialServiceMode = null,
    // Для client: уже выбранные услуги / дата / время
    initialServices = null,
    initialDate = '',
    initialTime = '',
    onSaved = null,
}) {
    const isEdit = mode === 'edit';
    const isClient = mode === 'client';

    // Режим: для edit берём из initialServiceMode, иначе — из masterMode
    const effectiveMode = isEdit && initialServiceMode ? initialServiceMode : masterMode;
    const isAway = effectiveMode === 'away';

    const maxServices = isEdit ? 1 : MAX_SERVICES_ADD;

    const { showAlert } = useModal();

    // ---- Данные ----
    const [categories, setCategories] = useState([]);
    const [uncategorized, setUncategorized] = useState([]);

    // ---- Выбранные услуги ----
    const [selectedServices, setSelectedServices] = useState(initialServices || []);
    const [selectedService, setSelectedService] = useState(null);

    // ---- Дата / время ----
    const [availableDates, setAvailableDates] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(initialDate || defaultDate || '');
    const [selectedTime, setSelectedTime] = useState(initialTime || defaultTime || '');
    const [selectedSlotEnd, setSelectedSlotEnd] = useState('');

    // ---- Клиент ----
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [comment, setComment] = useState('');

    // ---- Away ----
    const [travelBefore, setTravelBefore] = useState(0);
    const [travelAfter, setTravelAfter] = useState(0);
    const [durationExtra, setDurationExtra] = useState(0);

    // ---- Статусы загрузки ----
    const [loading, setLoading] = useState(true);
    const [loadingDates, setLoadingDates] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving] = useState(false);

    // ---- Нормализация выбранных услуг ----
    const servicesArray = isEdit
        ? (selectedService ? [selectedService] : [])
        : selectedServices;

    const totalDuration = servicesArray.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalPrice = servicesArray.reduce((sum, s) => sum + (s.price || 0), 0);

    // ---- Загрузка категорий ----
    useEffect(() => {
        loadMasterCategories(masterSlug)
            .then(data => {
                setCategories(data.categories || []);
                setUncategorized(data.uncategorized || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки услуг:', error);
                setLoading(false);
            });
    }, [masterSlug]);

    // ---- Загрузка дефолтов мастера (away: travel_before/after) ----
    // Только для add: клиент их не видит, в edit — из записи.
    useEffect(() => {
        if (!isAway || isEdit || isClient) return;
        const d = defaultDate || new Date().toISOString().split('T')[0];
        loadDayStatus(d)
            .then(data => {
                setTravelBefore(data.away_travel_time_before_default || 0);
                setTravelAfter(data.away_travel_time_after_default || 0);
            })
            .catch(error => {
                console.error('Ошибка загрузки дефолтов мастера:', error);
            });
    }, [isAway, isEdit, isClient, defaultDate]);

    // ---- Загрузка записи для edit ----
    useEffect(() => {
        if (!isEdit || !bookingId) return;

        loadBookingForEdit(bookingId)
            .then(data => {
                setSelectedDate(data.date);
                setSelectedTime(data.time);
                setClientName(data.client_name || '');
                setClientPhone(data.client_phone ? phoneMask(data.client_phone) : '');
                setClientAddress(data.client_address || '');
                setTravelBefore(data.travel_time_before || 0);
                setTravelAfter(data.travel_time_after || 0);
                setDurationExtra(data.duration_extra_minutes || 0);
                setComment(data.comment || '');
            })
            .catch(error => {
                console.error('Ошибка загрузки записи:', error);
                showAlert('Не удалось загрузить запись', 'error');
            });
    }, [isEdit, bookingId, showAlert]);

    // ---- Для edit: найти выбранную услугу по initialServiceId ----
    useEffect(() => {
        if (!isEdit || selectedService) return;
        if (!initialServiceId) return;
        if (categories.length === 0 && uncategorized.length === 0) return;

        const allServices = [
            ...categories.flatMap(c => c.services.map(s => ({ ...s, category_name: c.name }))),
            ...uncategorized.map(s => ({ ...s, category_name: null })),
        ];
        const found = allServices.find(s => s.id === initialServiceId);
        if (found) {
            setSelectedService(found);
        }
    }, [isEdit, selectedService, initialServiceId, categories, uncategorized]);

    // ---- Загрузка дат ----
    useEffect(() => {
        if (servicesArray.length === 0) {
            setAvailableDates([]);
            setAvailableSlots([]);
            return;
        }
        if (!totalDuration) return;

        setLoadingDates(true);
        loadAvailableDates(masterSlug, totalDuration)
            .then(data => {
                setAvailableDates(data.dates || []);
                setLoadingDates(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки дат:', error);
                setLoadingDates(false);
            });
    }, [servicesArray.length, totalDuration, masterSlug]);

    // ---- Загрузка слотов ----
    useEffect(() => {
        if (servicesArray.length === 0 || !selectedDate) {
            setAvailableSlots([]);
            return;
        }
        if (!totalDuration) return;

        setLoadingSlots(true);
        const params = new URLSearchParams({
            total_duration: String(totalDuration),
            date: selectedDate,
        });
        if (isEdit && bookingId) {
            params.set('exclude_booking_id', String(bookingId));
            params.set('original_booking_id', String(bookingId));
        }

        fetch(`/api/${masterSlug}/slots/?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                setAvailableSlots(data.slots || []);
                setLoadingSlots(false);
            })
            .catch(error => {
                console.error('Ошибка загрузки слотов:', error);
                setLoadingSlots(false);
            });
    }, [selectedDate, servicesArray.length, totalDuration, masterSlug, isEdit, bookingId]);

    // ---- Действия ----

    const toggleService = useCallback((service) => {
        if (isEdit) {
            setSelectedService(prev => prev?.id === service.id ? null : service);
            return;
        }
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            }
            if (prev.length >= maxServices) {
                showAlert(`Можно выбрать не более ${maxServices} услуг`, 'warning');
                return prev;
            }
            return [...prev, service];
        });
    }, [isEdit, maxServices, showAlert]);

    const selectService = useCallback((service) => {
        setSelectedService(service);
    }, []);

    const selectDate = useCallback((date) => {
        setSelectedDate(date);
        setSelectedTime('');
        setSelectedSlotEnd('');
    }, []);

    const selectTime = useCallback((slot) => {
        setSelectedTime(slot.start);
        setSelectedSlotEnd(slot.end || '');
    }, []);

    const reset = useCallback(() => {
        setSelectedServices([]);
        setSelectedService(null);
        setSelectedDate(defaultDate || '');
        setSelectedTime(defaultTime || '');
        setSelectedSlotEnd('');
        setClientName('');
        setClientPhone('');
        setClientAddress('');
        setComment('');
        setTravelBefore(isAway ? travelBefore : 0);
        setTravelAfter(isAway ? travelAfter : 0);
        setDurationExtra(0);
    }, [defaultDate, defaultTime, isAway, travelBefore, travelAfter]);

    // ---- Сохранение ----

    const save = useCallback(async () => {
        if (servicesArray.length === 0) {
            showAlert('Выберите услугу', 'warning');
            return null;
        }
        if (!selectedDate) {
            showAlert('Выберите дату', 'warning');
            return null;
        }
        if (!selectedTime) {
            showAlert('Выберите время', 'warning');
            return null;
        }
        if (!clientName.trim()) {
            showAlert('Введите имя клиента', 'warning');
            return null;
        }
        const phoneCleaned = clientPhone.replace(/\D/g, '');
        if (phoneCleaned.length !== 11) {
            showAlert('Телефон должен содержать 11 цифр', 'warning');
            return null;
        }
        if (isAway && !clientAddress.trim()) {
            showAlert('Укажите адрес клиента', 'warning');
            return null;
        }

        setSaving(true);
        try {
            if (isEdit) {
                const data = await updateBooking(bookingId, {
                    service_id: selectedService.id,
                    client_name: clientName.trim(),
                    client_phone: phoneCleaned,
                    date: selectedDate,
                    time: selectedTime,
                    comment: comment.trim(),
                    status: initialStatus,
                    client_address: clientAddress.trim(),
                    travel_time_before: parseInt(travelBefore) || 0,
                    travel_time_after: parseInt(travelAfter) || 0,
                    duration_extra_minutes: parseInt(durationExtra) || 0,
                });
                if (data.success) {
                    if (data.data && data.data.warning) {
                        showAlert(data.data.warning, 'warning');
                    }
                    if (onSaved) onSaved();
                    return data;
                } else {
                    showAlert(data.error || 'Ошибка сохранения', 'error');
                    return null;
                }
            }

            if (isClient) {
                // Клиент: created_by='client', без travel/duration_extra
                const data = await createBookings(masterSlug, {
                    services: selectedServices.map(s => s.id),
                    client_name: clientName.trim(),
                    client_phone: phoneCleaned,
                    date: selectedDate,
                    start_time: selectedTime,
                    client_address: isAway ? clientAddress.trim() : '',
                    comment: comment.trim(),
                    created_by: 'client',
                });
                if (data.success) {
                    if (onSaved) onSaved();
                    return data;
                } else {
                    showAlert(data.error || 'Ошибка создания записи', 'error');
                    return null;
                }
            }

            // Мастер: created_by='master', с travel/duration_extra
            const data = await createMultipleBookings(masterSlug, {
                services: selectedServices.map(s => s.id),
                client_name: clientName.trim(),
                client_phone: phoneCleaned,
                date: selectedDate,
                start_time: selectedTime,
                client_address: isAway ? clientAddress.trim() : '',
                comment: comment.trim(),
                created_by: 'master',
                travel_time_before: isAway ? (parseInt(travelBefore) || 0) : 0,
                travel_time_after: isAway ? (parseInt(travelAfter) || 0) : 0,
                duration_extra_minutes: parseInt(durationExtra) || 0,
            });
            if (data.success) {
                if (onSaved) onSaved();
                return data;
            } else {
                showAlert(data.error || 'Ошибка создания записи', 'error');
                return null;
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showAlert('Ошибка соединения', 'error');
            return null;
        } finally {
            setSaving(false);
        }
    }, [
        servicesArray, selectedDate, selectedTime, clientName, clientPhone,
        isAway, clientAddress, isEdit, isClient, bookingId, selectedService,
        masterSlug, selectedServices, comment, travelBefore, travelAfter,
        durationExtra, showAlert, onSaved, initialStatus,
    ]);

    return {
        // Данные
        categories,
        uncategorized,
        loading,
        loadingDates,
        loadingSlots,
        saving,

        // Услуги
        selectedServices,
        selectedService,
        servicesArray,
        toggleService,
        selectService,
        totalDuration,
        totalPrice,

        // Дата / время
        availableDates,
        availableSlots,
        selectedDate,
        selectedTime,
        selectedSlotEnd,
        selectDate,
        selectTime,

        // Клиент
        clientName,
        clientPhone,
        clientAddress,
        comment,
        setClientName,
        setClientPhone,
        setClientAddress,
        setComment,

        // Away
        travelBefore,
        travelAfter,
        durationExtra,
        setTravelBefore,
        setTravelAfter,
        setDurationExtra,

        // Действия
        reset,
        save,

        // Флаги
        isAway,
        isEdit,
        isClient,
    };
}