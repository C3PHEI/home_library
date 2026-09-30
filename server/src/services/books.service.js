import { NotFoundError, ValidationError } from '../errors/AppError.js'
import * as booksRepository from '../repositories/books.repository.js'
import { normalizeIsbn } from '../validation/isbn.js'
import { toBookListItemWithLocationDto, toFilterOptionsDto, toBookDetailWithLocationDto } from '../mappers/books.mapper.js'

const ALLOWED_SORTS = ['title', 'author', 'year', 'created']
const ALLOWED_DIRS = ['asc', 'desc']
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100
const MAX_DB_INT = 2147483647

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// Query-Parameter als String lesen. ?author=a&author=b ergibt in Express ein Array -> Fehler
function readString(value, fieldName) {
    if (value === undefined) return undefined
    if (typeof value !== 'string') {
        throw new ValidationError({ [fieldName]: 'Nur ein Wert erlaubt' })
    }
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
}

function parsePositiveInt(value, defaultValue, fieldName) {
    const str = readString(value, fieldName)
    if (str === undefined) return defaultValue

    const number = Number(str)
    if (!Number.isInteger(number) || number <= 0) {
        throw new ValidationError({ [fieldName]: 'Muss eine positive Ganzzahl sein' })
    }
    return number
}

function parseId(value) {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        throw new ValidationError({ id: 'Muss eine positive Ganzzahl sein' })
    }
    const id = Number(value)
    if (id <= 0 || id > MAX_DB_INT) {
        throw new ValidationError({ id: 'Muss eine positive Ganzzahl sein' })
    }
    return id
}

function parseFilters(query) {
    const author = readString(query.author, 'author')

    const language = readString(query.language, 'language')
    if (language !== undefined && !/^[a-z]{2,3}$/.test(language)) {
        throw new ValidationError({ language: 'Sprachcode wie de, fr, en' })
    }

    const yearStr = readString(query.year, 'year')
    let year
    if (yearStr !== undefined) {
        year = Number(yearStr)
        if (!Number.isInteger(year) || year < 1400 || year > 2100) {
            throw new ValidationError({ year: 'Jahr zwischen 1400 und 2100' })
        }
    }

    return { author, language, year }
}

// ---------------------------------------------------------------------------
// GET /api/books?sort=title&dir=asc&page=1&limit=25&author=&language=&year=
// ---------------------------------------------------------------------------

export async function getBooks(query = {}) {
    const sort = readString(query.sort, 'sort') ?? 'title'
    if (!ALLOWED_SORTS.includes(sort)) {
        throw new ValidationError({ sort: `Erlaubt: ${ALLOWED_SORTS.join(', ')}` })
    }

    const dir = readString(query.dir, 'dir') ?? 'asc'
    if (!ALLOWED_DIRS.includes(dir)) {
        throw new ValidationError({ dir: 'Erlaubt: asc, desc' })
    }

    const page = parsePositiveInt(query.page, 1, 'page')
    const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_LIMIT, 'limit'), MAX_LIMIT)
    const offset = (page - 1) * limit

    const filters = parseFilters(query)

    const [total, rows] = await Promise.all([
        booksRepository.countBooks(filters),
        booksRepository.findBooks(filters, sort, dir, limit, offset),
    ])

    const totalPages = Math.ceil(total / limit)
    const from = rows.length > 0 ? offset + 1 : 0
    const to = offset + rows.length

    return {
        sort,
        dir,
        filters,
        page,
        limit,
        total,
        totalPages,
        from,
        to,
        items: rows.map(toBookListItemWithLocationDto),
    }
}

// ---------------------------------------------------------------------------
// GET /api/books/filters
// ---------------------------------------------------------------------------

export async function getFilterOptions() {
    const [authors, languages, years] = await Promise.all([
        booksRepository.findDistinctAuthors(),
        booksRepository.findDistinctLanguages(),
        booksRepository.findDistinctYears(),
    ])

    return toFilterOptionsDto(authors, languages, years)
}

// ---------------------------------------------------------------------------
// GET /api/books/:id
// ---------------------------------------------------------------------------

export async function getBookById(idParam) {
    const id = parseId(idParam)

    const row = await booksRepository.findById(id)
    if (!row) throw new NotFoundError(`Buch ${id} nicht gefunden`)

    return toBookDetailWithLocationDto(row)
}

// ---------------------------------------------------------------------------
// POST /api/books
// ---------------------------------------------------------------------------
const MAX_TEXT = 500
const MAX_NOTE = 5000

function optionalText(body, key, maxLength, errors) {
    const value = body[key]
    if (value === undefined || value === null) return null
    if (typeof value !== 'string') {
        errors[key] = 'Muss ein Text sein'
        return null
    }
    const trimmed = value.trim()
    if (trimmed.length > maxLength) {
        errors[key] = `Maximal ${maxLength} Zeichen`
        return null
    }
    return trimmed === '' ? null : trimmed
}

function requiredText(body, key, errors) {
    const value = body[key]
    if (typeof value !== 'string' || value.trim() === '') {
        errors[key] = 'Pflichtfeld'
        return null
    }
    const trimmed = value.trim()
    if (trimmed.length > MAX_TEXT) {
        errors[key] = `Maximal ${MAX_TEXT} Zeichen`
        return null
    }
    return trimmed
}

function optionalInt(body, key, min, max, errors) {
    const value = body[key]
    if (value === undefined || value === null || value === '') return null
    if (!Number.isInteger(value) || value < min || value > max) {
        errors[key] = `Ganzzahl zwischen ${min} und ${max}`
        return null
    }
    return value
}

export async function createBook(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        throw new ValidationError({ body: 'JSON-Objekt erwartet' })
    }

    const errors = {}

    const title = requiredText(body, 'title', errors)
    const author = requiredText(body, 'author', errors)

    const shelfSlotId = body.shelfSlotId
    if (shelfSlotId === undefined || shelfSlotId === null) {
        errors.shelfSlotId = 'Pflichtfeld'
    } else if (!Number.isInteger(shelfSlotId) || shelfSlotId <= 0 || shelfSlotId > MAX_DB_INT) {
        errors.shelfSlotId = 'Muss eine positive Ganzzahl sein'
    }

    let isbn13 = null
    let isbn10 = null
    if (body.isbn !== undefined && body.isbn !== null && body.isbn !== '') {
        const normalized = typeof body.isbn === 'string' ? normalizeIsbn(body.isbn) : null
        if (normalized) {
            isbn13 = normalized.isbn13
            isbn10 = normalized.isbn10
        } else {
            errors.isbn = 'Ungültige ISBN (Prüfziffer stimmt nicht)'
        }
    }

    const publisher = optionalText(body, 'publisher', MAX_TEXT, errors)
    const note = optionalText(body, 'note', MAX_NOTE, errors)
    const publishedYear = optionalInt(body, 'publishedYear', 1400, 2100, errors)
    const pages = optionalInt(body, 'pages', 1, MAX_DB_INT, errors)

    let language = optionalText(body, 'language', 3, errors)
    if (language !== null) {
        language = language.toLowerCase()
        if (!/^[a-z]{2,3}$/.test(language)) {
            errors.language = 'Sprachcode wie de, fr, en'
        }
    }

    if (Object.keys(errors).length > 0) {
        throw new ValidationError(errors)
    }

    if (!(await booksRepository.slotExists(shelfSlotId))) {
        throw new ValidationError({ shelfSlotId: 'Diese Reihe gibt es nicht' })
    }

    // Duplikat-Warnung (FA-14): kein Fehler, das Buch wird trotzdem gespeichert
    const warnings = []
    if (isbn13) {
        const existing = await booksRepository.findByIsbn13(isbn13)
        if (existing.length > 0) {
            warnings.push({
                code: 'DUPLICATE_ISBN',
                existing: existing.map(row => ({
                    bookId: row.id,
                    title: row.title,
                    location: `${row.furniture_name}, ${row.slot_label}`,
                })),
            })
        }
    }

    const id = await booksRepository.insertBook({
        title, author, isbn13, isbn10, publisher, publishedYear,
        language, pages, note, shelfSlotId,
    })

    const row = await booksRepository.findById(id)
    return { book: toBookDetailWithLocationDto(row), warnings }
}

// Body: { shelfSlotId }
export async function moveBook(idParam, body) {
    const id = parseId(idParam)

    const slotId = body?.shelfSlotId
    if (slotId === undefined || slotId === null) {
        throw new ValidationError({ shelfSlotId: 'Pflichtfeld' })
    }
    if (!Number.isInteger(slotId) || slotId <= 0 || slotId > MAX_DB_INT) {
        throw new ValidationError({ shelfSlotId: 'Muss eine positive Ganzzahl sein' })
    }
    if (!(await booksRepository.slotExists(slotId))) {
        throw new ValidationError({ shelfSlotId: 'Diese Reihe gibt es nicht' })
    }

    const updated = await booksRepository.updateBookSlot(id, slotId)
    if (!updated) throw new NotFoundError(`Buch ${id} nicht gefunden`)

    const row = await booksRepository.findById(id)
    return toBookDetailWithLocationDto(row)
}