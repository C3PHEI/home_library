import { ValidationError } from '../errors/AppError.js'
import * as booksRepository from '../repositories/books.repository.js'
import { toBookListItemWithLocationDto } from '../mappers/books.mapper.js'

const ALLOWED_SORTS = ['title', 'author', 'year', 'created']
const ALLOWED_DIRS = ['asc', 'desc']
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

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