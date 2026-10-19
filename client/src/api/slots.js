import { apiGet } from './client.js'

// GET /api/slots/:id -> { id, label, furniture: { id, name }, room, bookCount }
export function getSlot(slotId, options) {
    return apiGet(`/slots/${slotId}`, options)
}

// GET /api/slots/:id/books?sort=title&page=1&limit=12
// -> { slotId, sort, page, limit, total, totalPages, from, to, items: [...] }
export function getSlotBooks(slotId, { sort, page, limit }, options) {
    const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) })
    return apiGet(`/slots/${slotId}/books?${params}`, options)
}