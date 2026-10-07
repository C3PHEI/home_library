import { ValidationError } from '../errors/AppError.js'
import * as searchRepository from '../repositories/search.repository.js'
import { toBookListItemWithLocationDto } from '../mappers/books.mapper.js'
import { cleanIsbn, normalizeIsbn } from '../validation/isbn.js'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50
const MAX_QUERY_LENGTH = 200
const MAX_WORDS = 10
const MIN_FUZZY_LENGTH = 3   // kürzere Begriffe ergeben bei der Ähnlichkeitssuche nur Rauschen

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// ?q=a&q=b ergibt in Express ein Array -> Fehler
function readQuery(value) {
    if (value !== undefined && typeof value !== 'string') {
        throw new ValidationError({ q: 'Nur ein Suchbegriff erlaubt' })
    }
    const q = (value ?? '').trim()
    if (q === '') {
        throw new ValidationError({ q: 'Pflichtfeld' }, 'Suchbegriff fehlt')
    }
    if (q.length > MAX_QUERY_LENGTH) {
        throw new ValidationError({ q: `Höchstens ${MAX_QUERY_LENGTH} Zeichen` })
    }
    return q
}

function readLimit(value) {
    if (value === undefined || value === '') return DEFAULT_LIMIT
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        throw new ValidationError({ limit: 'Muss eine positive Ganzzahl sein' })
    }
    const limit = Number(value)
    if (limit <= 0) {
        throw new ValidationError({ limit: 'Muss eine positive Ganzzahl sein' })
    }
    return Math.min(limit, MAX_LIMIT)
}

// Sieht q wie eine ISBN aus? Nur Ziffern, Bindestriche, Leerzeichen, X
// und danach genau 10 oder 13 Zeichen. "1984" ist damit kein ISBN-Fall.
// Ergebnis: { isbn13, isbn10 } oder null
function parseIsbnQuery(q) {
    if (!/^[0-9Xx\s-]+$/.test(q)) return null

    const cleaned = cleanIsbn(q)
    const normalized = normalizeIsbn(cleaned)
    if (normalized) return normalized

    // Prüfziffer falsch: trotzdem genau so suchen, wie es eingegeben wurde
    if (/^[0-9]{13}$/.test(cleaned)) return { isbn13: cleaned, isbn10: null }
    if (/^[0-9]{9}[0-9X]$/.test(cleaned)) return { isbn13: null, isbn10: cleaned }
    return null
}

// Wörter für die Volltextsuche: nur Buchstaben und Ziffern (auch Umlaute, é, ß ...).
// Alles andere trennt Wörter, so wie der 'simple'-Parser von PostgreSQL.
function splitWords(q) {
    return q
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter(word => word !== '')
        .slice(0, MAX_WORDS)
}

function toResult(q, mode, rows, limit) {
    return {
        query: q,
        mode,                       // 'isbn' | 'fulltext' | 'fuzzy'
        fuzzy: mode === 'fuzzy',    // Frontend: "Keine genauen Treffer, ähnliche Ergebnisse"
        items: rows.map(toBookListItemWithLocationDto),
        total: rows[0]?.total ?? 0,
        limit,
    }
}

// ---------------------------------------------------------------------------
// GET /api/search?q=suesskin&limit=20
// ---------------------------------------------------------------------------

export async function search(query = {}) {
    const q = readQuery(query.q)
    const limit = readLimit(query.limit)

    // 1. ISBN: genau auf isbn13 oder isbn10 suchen, kein Rückfall auf die Textsuche
    const isbn = parseIsbnQuery(q)
    if (isbn) {
        const rows = await searchRepository.findByIsbn(isbn.isbn13, isbn.isbn10, limit)
        return toResult(q, 'isbn', rows, limit)
    }

    // 2. Volltextsuche (GIN-Index)
    const words = splitWords(q)
    if (words.length > 0) {
        const rows = await searchRepository.findByFullText(words, limit)
        if (rows.length > 0) {
            return toResult(q, 'fulltext', rows, limit)
        }
    }

    // 3. Nichts gefunden: Tippfehler-Suche (pg_trgm)
    if (q.length >= MIN_FUZZY_LENGTH) {
        const rows = await searchRepository.findBySimilarity(q, limit)
        return toResult(q, 'fuzzy', rows, limit)
    }

    return toResult(q, 'fulltext', [], limit)
}