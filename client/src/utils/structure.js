import { deleteFurniture, deleteRoom, renameFurniture, renameRoom } from '../api/locations.js'
import { deleteSlot, renameSlot } from '../api/slots.js'
import { furnitureTypeLabel } from './furniture.js'

// Ein "Ziel" ist das, was umbenannt oder gelöscht wird: ein Raum,
// ein Möbelstück oder ein Fach. Die Dialoge kennen nur diese Form:
//   { level, id, name, noun, slotIds, bookCount, ... }
// slotIds = alle Fächer, die beim Löschen wegfallen.

function sumBooks(slots) {
    return slots.reduce((sum, slot) => sum + slot.bookCount, 0)
}

export function roomTarget(room) {
    const slots = room.furniture.flatMap((furniture) => furniture.slots)
    return {
        level: 'room',
        id: room.key, // Name in der Datenbank
        name: room.room,
        noun: 'Raum',
        furnitureCount: room.furniture.length,
        slotIds: slots.map((slot) => slot.id),
        bookCount: sumBooks(slots),
    }
}

export function furnitureTarget(furniture) {
    return {
        level: 'furniture',
        id: furniture.id,
        name: furniture.name,
        noun: furnitureTypeLabel(furniture.type), // "Regal", "Schrank" ...
        slotIds: furniture.slots.map((slot) => slot.id),
        bookCount: furniture.bookCount,
    }
}

export function slotTarget(slot, furniture) {
    return {
        level: 'slot',
        id: slot.id,
        name: slot.label,
        noun: 'Fach',
        furnitureName: furniture.name,
        slotIds: [slot.id],
        bookCount: slot.bookCount,
    }
}

export function renameTarget(target, name) {
    switch (target.level) {
        case 'room':
            return renameRoom(target.id, name)
        case 'furniture':
            return renameFurniture(target.id, name)
        default:
            return renameSlot(target.id, name)
    }
}

// moveTo: Fach-ID, in das die Bücher umziehen (oder null)
export function deleteTarget(target, moveTo) {
    switch (target.level) {
        case 'room':
            return deleteRoom(target.id, moveTo)
        case 'furniture':
            return deleteFurniture(target.id, moveTo)
        default:
            return deleteSlot(target.id, moveTo)
    }
}