import { apiGet, apiSend } from './client.js'

// GET /api/locations -> { totals, rooms: [{ room, key, furniture: [{ id, name, type, icon, bookCount, slots }] }] }
export function getLocations(options) {
    return apiGet('/locations', options)
}

// ?moveTo=12, wenn Bücher umziehen müssen
function moveToQuery(moveTo) {
    return moveTo ? `?moveTo=${moveTo}` : ''
}

// PATCH /api/rooms/:name -> { room }
export function renameRoom(room, name) {
    return apiSend('PATCH', `/rooms/${encodeURIComponent(room)}`, { name })
}

// DELETE /api/rooms/:name?moveTo=12 -> { deletedFurniture, deletedSlots, movedBooks, movedTo }
export function deleteRoom(room, moveTo) {
    return apiSend('DELETE', `/rooms/${encodeURIComponent(room)}${moveToQuery(moveTo)}`)
}

// PATCH /api/furniture/:id -> { id, name, icon }
export function updateFurniture(id, changes) {
    return apiSend('PATCH', `/furniture/${id}`, changes)
}

// DELETE /api/furniture/:id?moveTo=12
export function deleteFurniture(id, moveTo) {
    return apiSend('DELETE', `/furniture/${id}${moveToQuery(moveTo)}`)
}