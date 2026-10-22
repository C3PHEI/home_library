// "Regal A, Reihe 3". Tische haben nur eine "Ablage" (siehe 01_schema.sql),
// dort reicht der Möbelname: "Nachttisch 1".
export function placeLabel(location) {
    if (location.slotLabel === 'Ablage') return location.furnitureName
    return `${location.furnitureName}, ${location.slotLabel}`
}