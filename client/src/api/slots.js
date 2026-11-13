import { apiGet, apiSend } from './client.js'

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

// PATCH /api/slots/:id -> { id, label }
export function renameSlot(slotId, label) {
    return apiSend('PATCH', `/slots/${slotId}`, { label })
}

// DELETE /api/slots/:id?moveTo=12 -> { deletedFurniture, deletedSlots, movedBooks, movedTo }
export function deleteSlot(slotId, moveTo) {
    return apiSend('DELETE', `/slots/${slotId}${moveTo ? `?moveTo=${moveTo}` : ''}`)
}

// POST /api/furniture/:id/slots -> { id, label, furnitureId, bookCount }
// Neues Fach am Ende eines Möbelstücks
export function createSlot(furnitureId, label) {
    return apiSend('POST', `/furniture/${furnitureId}/slots`, { label })
}