import { apiGet } from './client.js'

// GET /api/isbn/:isbn?refresh=true
// -> { isbn13, isbn10, found, source, cached, fetchedAt, attempts, data, cover, existing }
// refresh: true umgeht den Zwischenspeicher im Backend
export function lookupIsbn(isbn, { refresh = false } = {}, options) {
    const query = refresh ? '?refresh=true' : ''
    return apiGet(`/isbn/${encodeURIComponent(isbn)}${query}`, options)
}