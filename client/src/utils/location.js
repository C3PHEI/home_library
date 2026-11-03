// "Regal A, Reihe 3". Tische haben nur eine "Ablage" (siehe 01_schema.sql),
// dort reicht der Möbelname: "Nachttisch 1".
export function placeLabel(location) {
    if (location.slotLabel === 'Ablage') return location.furnitureName
    return `${location.furnitureName}, ${location.slotLabel}`
}

// Baum aus GET /api/locations -> Gruppen für das Standort-Dropdown:
// Leere Reihen bekommen "(leer)", wie im Mockup.
// excludeIds: Fächer, die nicht zur Auswahl stehen (z. B. die gerade gelöscht werden)
export function slotOptionGroups(rooms, excludeIds = new Set()) {
    return rooms
        .map((room) => ({
            room: room.room,
            options: room.furniture.flatMap((furniture) =>
                furniture.slots.filter((slot) => !excludeIds.has(slot.id)).map((slot) => {
                    const label = placeLabel({ furnitureName: furniture.name, slotLabel: slot.label })
                    return { id: slot.id, label: slot.bookCount === 0 ? `${label} (leer)` : label }
                }),
            ),
        }))
        .filter((group) => group.options.length > 0)
}

// Fach-ID im Baum suchen -> "Regal A, Reihe 3 (Wohnzimmer)"
export function findSlotPlace(rooms, slotId) {
    for (const room of rooms) {
        for (const furniture of room.furniture) {
            const slot = furniture.slots.find((entry) => entry.id === slotId)
            if (slot) {
                return `${placeLabel({ furnitureName: furniture.name, slotLabel: slot.label })} (${room.room})`
            }
        }
    }
    return null
}