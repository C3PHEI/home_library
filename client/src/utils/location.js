// "Regal A, Reihe 3". Tische haben nur eine "Ablage" (siehe 01_schema.sql),
// dort reicht der Möbelname: "Nachttisch 1".
export function placeLabel(location) {
    if (location.slotLabel === 'Ablage') return location.furnitureName
    return `${location.furnitureName}, ${location.slotLabel}`
}

// Baum aus GET /api/locations -> Gruppen für das Standort-Dropdown:
// [{ room: 'Wohnzimmer', options: [{ id: 3, label: 'Regal A, Reihe 3' }, ...] }]
// Leere Reihen bekommen "(leer)", wie im Mockup.
export function slotOptionGroups(rooms) {
    return rooms
        .map((room) => ({
            room: room.room,
            options: room.furniture.flatMap((furniture) =>
                furniture.slots.map((slot) => {
                    const label = placeLabel({ furnitureName: furniture.name, slotLabel: slot.label })
                    return { id: slot.id, label: slot.bookCount === 0 ? `${label} (leer)` : label }
                }),
            ),
        }))
        .filter((group) => group.options.length > 0)
}