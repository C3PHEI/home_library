import { apiGet } from './client.js'

// GET /api/search?q=süskin -> { query, total, tabs, items }
export function searchBooks(q, options) {
    const params = new URLSearchParams({ q })
    return apiGet(`/search?${params}`, options)
}