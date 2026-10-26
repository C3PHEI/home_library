// Prüfziffer schon beim Eintippen kontrollieren. Gleiche Regeln wie im Backend
// (server/src/validation/isbn.js), damit ein Tippfehler keine Anfrage verschwendet.

// "978-3-257 22800-7" -> "9783257228007"
export function cleanIsbn(value) {
    return value.replace(/[\s-]/g, '').toUpperCase()
}

// Ergebnis: { state, isbn }
//   empty    nichts eingegeben
//   typing   noch unvollständig (oder 10 Stellen, die keine ISBN-10 sind:
//            vielleicht wird gerade eine ISBN-13 getippt)
//   valid    Prüfziffer stimmt
//   invalid  falsche Zeichen, zu lang oder falsche Prüfziffer bei 13 Stellen
export function checkIsbn(value) {
    const isbn = cleanIsbn(value)

    if (isbn === '') return { state: 'empty', isbn }
    // Nur Ziffern, ein X darf nur als 10. Stelle stehen (Prüfziffer der ISBN-10)
    if (!/^(\d+|\d{9}X)$/.test(isbn)) {
        return { state: 'invalid', isbn, message: 'Nur Ziffern und Bindestriche, ein X nur am Ende einer ISBN-10' }
    }
    if (isbn.length > 13) {
        return { state: 'invalid', isbn, message: 'Eine ISBN hat höchstens 13 Stellen' }
    }
    if (isbn.length === 13) {
        return isValidIsbn13(isbn)
            ? { state: 'valid', isbn, kind: 'ISBN-13' }
            : { state: 'invalid', isbn, message: 'Prüfziffer stimmt nicht, bitte ISBN kontrollieren' }
    }
    if (isbn.length === 10 && isValidIsbn10(isbn)) {
        return { state: 'valid', isbn, kind: 'ISBN-10' }
    }
    return { state: 'typing', isbn }
}

// Meldung, wenn mit einer unfertigen ISBN abgerufen oder gespeichert wird
export function isbnProblem(check) {
    if (check.state === 'empty') return 'ISBN eingeben'
    if (check.state === 'invalid') return check.message
    if (check.state === 'typing') {
        return check.isbn.length === 10
            ? 'Prüfziffer stimmt nicht, bitte ISBN kontrollieren'
            : 'Eine ISBN hat 10 oder 13 Stellen'
    }
    return null
}

function isValidIsbn10(isbn) {
    let sum = 0
    for (let i = 0; i < 10; i++) {
        const digit = isbn[i] === 'X' ? 10 : Number(isbn[i])
        sum += digit * (10 - i)
    }
    return sum % 11 === 0
}

function isValidIsbn13(isbn) {
    if (!/^97[89]/.test(isbn)) return false
    let sum = 0
    for (let i = 0; i < 13; i++) {
        sum += Number(isbn[i]) * (i % 2 === 0 ? 1 : 3)
    }
    return sum % 10 === 0
}