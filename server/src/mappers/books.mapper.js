import { toBookListItemDto } from './slots.mapper.js'

// Listeneintrag + Standort (für die Gesamtliste, dort ist die Reihe nicht vorgegeben)
export function toBookListItemWithLocationDto(row) {
    return {
        ...toBookListItemDto(row),
        location: {
            slotId: row.shelf_slot_id,
            slotLabel: row.slot_label,
            furnitureId: row.furniture_id,
            furnitureName: row.furniture_name,
            room: row.room,
        },
    }
}