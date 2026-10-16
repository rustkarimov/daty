// frontend/src/utils/date.js
// ============================================================
// Утилиты для работы с датами.
// ============================================================

export const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export const WEEKDAY_NAMES = [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота'
];

export const WEEKDAY_NAMES_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/**
 * Парсит строку даты в объект Date.
 * Поддерживает два формата: 'YYYY-MM-DD' и 'DD.MM.YYYY'.
 * Возвращает null, если строка не распознана или невалидна.
 */
function parseDate(input) {
    if (!input) return null;

    let d = null;

    // ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [y, m, day] = input.split('-').map(Number);
        d = new Date(y, m - 1, day);
    }
    // Русский: DD.MM.YYYY
    else if (/^\d{2}\.\d{2}\.\d{4}$/.test(input)) {
        const [day, m, y] = input.split('.').map(Number);
        d = new Date(y, m - 1, day);
    }
    else {
        return null;
    }

    if (isNaN(d.getTime())) return null;
    return d;
}

/**
 * Форматирует дату в «13 октября (вторник)».
 * Если строка не распознана — возвращает её как есть.
 */
export function formatDate(input) {
    const d = parseDate(input);
    if (!d) return input || '';
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} (${WEEKDAY_NAMES[d.getDay()]})`;
}

/**
 * Форматирует дату в «13 октября».
 */
export function formatDateShort(input) {
    const d = parseDate(input);
    if (!d) return input || '';
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

/**
 * Форматирует дату в «13 октября (вторник) 2026».
 */
export function formatDateFull(input) {
    const d = parseDate(input);
    if (!d) return input || '';
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} (${WEEKDAY_NAMES[d.getDay()]}) ${d.getFullYear()}`;
}