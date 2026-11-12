import { apiGet, apiSend } from './client.js'

// Adresse der CSV-Datei mit allen Büchern (GET /api/books/export.csv), für einen Download-Link
export const BOOKS_CSV_URL = '/api/books/export.csv'

// GET /api/books?sort=title&dir=asc&page=1&limit=25&author=&language=&year=
// -> { sort, dir, filters, page, limit, total, totalPages, from, to, items: [{ id, title, author, ..., location }] }
// Leere Angaben werden weggelassen, dann gelten die Vorgaben des Backends.
export function getBooks({ sort, dir, page, limit, author, language, year } = {}, options) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries({ sort, dir, page, limit, author, language, year })) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
    }
    const query = params.toString()
    return apiGet(query ? `/books?${query}` : '/books', options)
}

// GET /api/books/filters
// -> { authors: [{ value, count }], languages: [{ value, label, count }], years: [{ value, count }] }
export function getBookFilters(options) {
    return apiGet('/books/filters', options)
}

// POST /api/books
// Body: { title, author, shelfSlotId, isbn?, publisher?, publishedYear?, language?, pages?, note?, coverTempId? }
// -> 201 { book: { id, title, ..., location }, warnings: [{ code: 'DUPLICATE_ISBN' | 'COVER_NOT_SAVED', ... }] }
export function createBook(book, options) {
    return apiSend('POST', '/books', book, options)
}