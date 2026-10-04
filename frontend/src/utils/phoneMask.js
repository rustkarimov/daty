export function phoneMask(value) {
    let digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits[0] !== '7' && digits[0] !== '8') {
        digits = '7' + digits;
    }
    if (digits[0] === '8') {
        digits = '7' + digits.slice(1);
    }
    if (digits.length > 11) digits = digits.slice(0, 11);

    let formatted = digits[0];
    if (digits.length > 1) formatted += ' ' + digits.slice(1, 4);
    if (digits.length > 4) formatted += ' ' + digits.slice(4, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 11);
    return formatted;
}