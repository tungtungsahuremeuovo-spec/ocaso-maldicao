export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() :
        'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function getModifier(attributeValue) {
    if (attributeValue >= 7) return '+4';
    if (attributeValue >= 6) return '+3';
    if (attributeValue >= 5) return '+2';
    if (attributeValue >= 4) return '+1';
    if (attributeValue >= 3) return '0';
    if (attributeValue >= 2) return '-1';
    return '-2';
}

export function getGrauBonus(grau) {
    const bonuses = { '4': 1, '3': 2, '2': 3, '1': 4, 'E': 4 };
    return bonuses[grau] || 1;
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

export function debounce(fn, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}