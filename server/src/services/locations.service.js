import * as locationsRepository from '../repositories/locations.repository.js'
import {toLocationTree} from '../mappers/location.mapper.js'

// Reihenfolge der Räume wie in den Mockups. Unbekannte Räume kommen ans Ende.
const ROOM_ORDER = ['Wohnzimmer', 'Schlafzimmer', 'Büro']

export async function getTree() {
    const rows = await locationsRepository.findAllWithBookCounts(ROOM_ORDER)
    return toLocationTree(rows)
}