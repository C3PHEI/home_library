// mit ihrem Anzeigenamen. Die Reihenfolge gilt auch für Auswahllisten.
export const FURNITURE_TYPES = [
    { value: 'shelf', label: 'Regal' },
    { value: 'cabinet', label: 'Schrank' },
    { value: 'table', label: 'Tisch' },
    { value: 'nightstand', label: 'Nachttisch' },
    { value: 'other', label: 'Sonstiges' },
]

// 'cabinet' -> 'Schrank'. Unbekannte Werte erscheinen als "Sonstiges".
export function furnitureTypeLabel(type) {
    return FURNITURE_TYPES.find((entry) => entry.value === type)?.label ?? 'Sonstiges'
}