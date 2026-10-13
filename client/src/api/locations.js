import { apiGet } from './client.js'

// GET /api/locations -> { totals, rooms: [{ room, furniture: [{ id, name, type, bookCount, slots }] }] }
export function getLocations(options) {
    return apiGet('/locations', options)
}