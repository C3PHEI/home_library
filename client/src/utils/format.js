// 1403 -> "1 403" (schmales, nicht umbrechendes Leerzeichen wie im Mockup)
export function formatCount(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')
}

// plural(1, 'Buch', 'Bücher') -> "1 Buch", plural(51, ...) -> "51 Bücher"
export function plural(count, singular, pluralForm) {
    return `${formatCount(count)} ${count === 1 ? singular : pluralForm}`
}