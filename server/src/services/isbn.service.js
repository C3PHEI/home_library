import { ValidationError } from '../errors/AppError.js'
import * as isbnCacheRepository from '../repositories/isbnCache.repository.js'
import * as booksRepository from '../repositories/books.repository.js'
import { cleanIsbn, normalizeIsbn } from '../validation/isbn.js'
import { lookupIsbn } from './isbnLookup/index.js'

// ---------------------------------------------------------------------------
// GET /api/isbn/:isbn?refresh=true
// ---------------------------------------------------------------------------

export async function lookup(isbnParam, query = {}) {
    const cleaned = cleanIsbn(isbnParam ?? '')
    if (!/^(\d{9}[\dX]|\d{13})$/.test(cleaned)) {
        throw new ValidationError({ isbn: 'ISBN muss 10 oder 13 Stellen haben' })
    }
    const normalized = normalizeIsbn(cleaned)
    if (!normalized) {
        throw new ValidationError({ isbn: 'Prüfziffer stimmt nicht, bitte ISBN kontrollieren' })
    }
    const { isbn13, isbn10 } = normalized

    // ?refresh=true umgeht den Zwischenspeicher (zum Testen oder bei falschen Daten)
    const refresh = query.refresh === 'true'

    let cached = false
    let entry = refresh ? null : await isbnCacheRepository.findFresh(isbn13)

    if (entry) {
        cached = true
    } else {
        entry = await fetchFromSources(isbn13, isbn10)
    }

    // Immer frisch aus der DB: steht das Buch schon im Regal? (FA-14)
    const existingRows = await booksRepository.findByIsbn13(isbn13)

    return {
        isbn13,
        isbn10,
        found: entry.found,
        source: entry.source,
        cached,
        fetchedAt: entry.fetched_at,
        attempts: entry.payload.attempts,
        data: entry.payload.data,
        cover: entry.payload.cover,
        existing: existingRows.map(row => ({
            bookId: row.id,
            title: row.title,
            location: `${row.furniture_name}, ${row.slot_label}`,
        })),
    }
}

async function fetchFromSources(isbn13, isbn10) {
    const { result, attempts } = await lookupIsbn(isbn13, isbn10)

    const source = result?.source ?? null
    const payload = {
        attempts,
        data: result?.data ?? null,
        cover: result?.coverUrl ? { url: result.coverUrl, source } : null,
    }
    const entry = { found: source !== null, source, payload, fetched_at: new Date() }

    // "Nicht gefunden" nur speichern, wenn alle Quellen sauber geantwortet haben.
    const hadFailure = attempts.some(a => a.status === 'timeout' || a.status === 'error')
    if (entry.found || !hadFailure) {
        try {
            entry.fetched_at = await isbnCacheRepository.save(isbn13, source, payload)
        } catch (err) {
            // Cache ist nur eine Abkürzung, ohne ihn funktioniert der Abruf trotzdem
            console.warn('ISBN-Cache konnte nicht gespeichert werden:', err.message)
        }
    }
    return entry
}