// Gemeinsames für "Erfassen über ISBN" und "Erfassen ohne ISBN"

export const EMPTY_BOOK = {
    title: '',
    author: '',
    publisher: '',
    publishedYear: '',
    language: '',
    pages: '',
    shelfSlotId: '',
    note: '',
}

export const EMPTY_COVER = { choice: 'none', upload: null, uploading: false, error: null }

export const MAX_COVER_BYTES = 10 * 1024 * 1024
export const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Feld -> id der Eingabe, in Reihenfolge auf der Seite (dorthin springt der Fokus beim ersten Fehler)
export const BOOK_FIELD_IDS = {
    title: 'book-title',
    author: 'book-author',
    publisher: 'book-publisher',
    publishedYear: 'book-year',
    language: 'book-language',
    pages: 'book-pages',
    shelfSlotId: 'book-location',
    note: 'book-note',
}

// Pflichtfelder, die noch fehlen: ['Titel', 'Standort']
export function missingRequired(book, slotValue) {
    return [
        !book.title.trim() && 'Titel',
        !book.author.trim() && 'Autor',
        !slotValue && 'Standort',
    ].filter(Boolean)
}

// Standort aus ?slot=, den es nicht (mehr) gibt, gilt als nicht gewählt
export function validSlotValue(slotGroups, value) {
    return slotGroups.some((group) => group.options.some((option) => String(option.id) === value)) ? value : ''
}

// Prüft Jahr und Seitenzahl wie das Backend und baut die gemeinsamen Felder für POST /api/books.
// -> { fields, errors } (errors ist ein leeres Objekt, wenn alles passt)
export function bookPayloadFields(book, slotValue) {
    const errors = {}

    const publishedYear = parseOptionalInt(book.publishedYear)
    if (publishedYear === undefined || (publishedYear !== null && (publishedYear < 1400 || publishedYear > 2100))) {
        errors.publishedYear = 'Jahr mit vier Ziffern, zwischen 1400 und 2100'
    }

    const pages = parseOptionalInt(book.pages)
    if (pages === undefined || pages === 0) {
        errors.pages = 'Nur Ziffern, mindestens 1'
    }

    return {
        errors,
        fields: {
            title: book.title.trim(),
            author: book.author.trim(),
            publisher: book.publisher.trim() || null,
            publishedYear,
            language: book.language || null,
            pages,
            note: book.note.trim() || null,
            shelfSlotId: Number(slotValue),
        },
    }
}

// "" -> null, "320" -> 320, "32a" -> undefined (ungültig)
export function parseOptionalInt(value) {
    const trimmed = value.trim()
    if (trimmed === '') return null
    if (!/^\d+$/.test(trimmed)) return undefined
    return Number(trimmed)
}

// Datei vor dem Hochladen prüfen. -> Fehlermeldung oder null
export function coverFileProblem(file) {
    if (file.type && !COVER_TYPES.includes(file.type)) return 'Nur JPEG, PNG oder WebP.'
    if (file.size > MAX_COVER_BYTES) return 'Das Bild ist grösser als 10 MB. Bitte ein kleineres wählen.'
    return null
}

export function uploadErrorMessage(error) {
    if (error.status === 413) return 'Das Bild ist grösser als 10 MB. Bitte ein kleineres wählen.'
    if (error.status === 400) return error.fields?.file ?? error.message
    return `Hochladen hat nicht geklappt: ${error.message}`
}

// fieldIds: { feld: 'element-id' } in Reihenfolge auf der Seite
export function focusFirstError(errors, fieldIds) {
    const key = Object.keys(fieldIds).find((name) => errors[name])
    if (key) document.getElementById(fieldIds[key])?.focus()
}

export function omit(object, keys) {
    const copy = { ...object }
    for (const key of keys) delete copy[key]
    return copy
}