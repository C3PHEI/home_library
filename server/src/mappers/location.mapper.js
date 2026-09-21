// Flache Zeilen aus der Datenbank -> Baum: Raum -> Möbel -> Reihen
export function toLocationTree(rows) {
    const rooms = new Map()
    const furnitureById = new Map()
    let slotCount = 0
    let bookCount = 0

    for (const row of rows) {
        const roomName = row.room ?? 'Ohne Raum'

        if (!rooms.has(roomName)) {
            rooms.set(roomName, { room: roomName, furniture: [] })
        }

        let furniture = furnitureById.get(row.furniture_id)
        if (!furniture) {
            furniture = {
                id: row.furniture_id,
                name: row.furniture_name,
                type: row.furniture_type,
                bookCount: 0,
                slots: []
            }
            furnitureById.set(row.furniture_id, furniture)
            rooms.get(roomName).furniture.push(furniture)
        }

        if (row.slot_id !== null) {
            furniture.slots.push({
                id: row.slot_id,
                label: row.slot_label,
                bookCount: row.book_count
            })
            furniture.bookCount += row.book_count
            slotCount++
            bookCount += row.book_count
        }
    }

    return {
        totals: { furniture: furnitureById.size, slots: slotCount, books: bookCount },
        rooms: [...rooms.values()]
    }
}