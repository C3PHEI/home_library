import { deleteFurniture, deleteRoom, updateFurniture, updateRoom } from '../api/locations.js'
import { deleteSlot, renameSlot } from '../api/slots.js'
import { furnitureTypeLabel } from './furniture.js'
import { furnitureIconKey, roomIconKey } from './icons.js'

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
        icon: roomIconKey(room), // Icon, das gerade angezeigt wird
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
        icon: furnitureIconKey(furniture), // Icon, das gerade angezeigt wird
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

// icon nur bei Raum und Möbel (beim Fach ignoriert)
export function renameTarget(target, name, icon) {
    switch (target.level) {
        case 'room':
            return updateRoom(target.id, { name, icon })
        case 'furniture':
            return updateFurniture(target.id, { name, icon })
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