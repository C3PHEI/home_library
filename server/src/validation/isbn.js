// ISBN-Helfer: Prüfziffer kontrollieren und zwischen ISBN-10 und ISBN-13 umwandeln.
export function cleanIsbn(value) {
    return String(value).replace(/[\s-]/g, '').toUpperCase()
}

export function isValidIsbn10(isbn10) {
    if (!/^[0-9]{9}[0-9X]$/.test(isbn10)) return false
    let sum = 0
    for (let i = 0; i < 10; i++) {
        const digit = isbn10[i] === 'X' ? 10 : Number(isbn10[i])
        sum += digit * (10 - i)
    }
    return sum % 11 === 0
}

export function isValidIsbn13(isbn13) {
    if (!/^97[89][0-9]{10}$/.test(isbn13)) return false
    let sum = 0
    for (let i = 0; i < 13; i++) {
        sum += Number(isbn13[i]) * (i % 2 === 0 ? 1 : 3)
    }
    return sum % 10 === 0
}

export function isbn10To13(isbn10) {
    const base = '978' + isbn10.slice(0, 9)
    let sum = 0
    for (let i = 0; i < 12; i++) {
        sum += Number(base[i]) * (i % 2 === 0 ? 1 : 3)
    }
    return base + ((10 - (sum % 10)) % 10)
}

// nur mit Präfix 978 möglich (979 hat keine ISBN-10)
export function isbn13To10(isbn13) {
    if (!isbn13.startsWith('978')) return null
    const base = isbn13.slice(3, 12)
    let sum = 0
    for (let i = 0; i < 9; i++) {
        sum += Number(base[i]) * (10 - i)
    }
    const check = (11 - (sum % 11)) % 11
    return base + (check === 10 ? 'X' : String(check))
}

// Ergebnis: { isbn13, isbn10 } oder null, wenn ungültig
export function normalizeIsbn(value) {
    const cleaned = cleanIsbn(value)
    if (cleaned.length === 13 && isValidIsbn13(cleaned)) {
        return { isbn13: cleaned, isbn10: isbn13To10(cleaned) }
    }
    if (cleaned.length === 10 && isValidIsbn10(cleaned)) {
        return { isbn13: isbn10To13(cleaned), isbn10: cleaned }
    }
    return null
}