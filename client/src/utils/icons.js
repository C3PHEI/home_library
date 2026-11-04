import {
    Archive,
    Armchair,
    Baby,
    Bath,
    BedDouble,
    BedSingle,
    BookOpen,
    Box,
    BriefcaseBusiness,
    Car,
    CookingPot,
    DoorClosed,
    DoorOpen,
    House,
    LampFloor,
    Library,
    LibraryBig,
    Monitor,
    Moon,
    Package,
    Sofa,
    Trees,
    Utensils,
    Warehouse,
} from 'lucide-react'

// Icons zum Auswählen. key wird in der Datenbank gespeichert
// (furniture.icon bzw. room_icon.icon). Neues Icon auch im Backend
// eintragen: server/src/validation/icons.js

// Für Möbel (Dialog "Regal bearbeiten")
export const FURNITURE_ICONS = [
    { key: 'book-open', label: 'Regal', Icon: BookOpen },
    { key: 'library', label: 'Bücherreihe', Icon: Library },
    { key: 'library-big', label: 'Bücherwand', Icon: LibraryBig },
    { key: 'door-open', label: 'Schrank offen', Icon: DoorOpen },
    { key: 'door-closed', label: 'Schrank zu', Icon: DoorClosed },
    { key: 'archive', label: 'Kommode', Icon: Archive },
    { key: 'box', label: 'Kiste', Icon: Box },
    { key: 'package', label: 'Karton', Icon: Package },
    { key: 'sofa', label: 'Couch', Icon: Sofa },
    { key: 'armchair', label: 'Sessel', Icon: Armchair },
    { key: 'lamp-floor', label: 'Leselampe', Icon: LampFloor },
    { key: 'bed-double', label: 'Bett', Icon: BedDouble },
    { key: 'moon', label: 'Nachttisch', Icon: Moon },
    { key: 'monitor', label: 'Schreibtisch', Icon: Monitor },
]

// Für Räume (Dialog "Raum bearbeiten")
export const ROOM_ICONS = [
    { key: 'sofa', label: 'Wohnzimmer', Icon: Sofa },
    { key: 'moon', label: 'Schlafzimmer', Icon: Moon },
    { key: 'bed-single', label: 'Gästezimmer', Icon: BedSingle },
    { key: 'briefcase-business', label: 'Büro', Icon: BriefcaseBusiness },
    { key: 'library-big', label: 'Bibliothek', Icon: LibraryBig },
    { key: 'cooking-pot', label: 'Küche', Icon: CookingPot },
    { key: 'utensils', label: 'Esszimmer', Icon: Utensils },
    { key: 'bath', label: 'Bad', Icon: Bath },
    { key: 'baby', label: 'Kinderzimmer', Icon: Baby },
    { key: 'door-open', label: 'Flur', Icon: DoorOpen },
    { key: 'warehouse', label: 'Keller oder Estrich', Icon: Warehouse },
    { key: 'car', label: 'Garage', Icon: Car },
    { key: 'trees', label: 'Garten', Icon: Trees },
    { key: 'house', label: 'Anderer Raum', Icon: House },
]

const FURNITURE_BY_KEY = new Map(FURNITURE_ICONS.map((entry) => [entry.key, entry]))
const ROOM_BY_KEY = new Map(ROOM_ICONS.map((entry) => [entry.key, entry]))

// ---------------------------------------------------------------------------
// Möbel
// ---------------------------------------------------------------------------

// Ohne eigenes Icon: Standard nach Möbeltyp
const DEFAULT_ICON_BY_TYPE = {
    shelf: 'book-open',
    cabinet: 'door-open',
    table: 'sofa',
    nightstand: 'moon',
    other: 'archive',
}

// Schlüssel des Icons, das ein Möbel gerade zeigt
export function furnitureIconKey(furniture) {
    if (furniture.icon && FURNITURE_BY_KEY.has(furniture.icon)) return furniture.icon
    return DEFAULT_ICON_BY_TYPE[furniture.type] ?? 'book-open'
}

// 'sofa' -> { key, label, Icon }
export function furnitureIconEntry(key) {
    return FURNITURE_BY_KEY.get(key) ?? FURNITURE_BY_KEY.get('book-open')
}

// ---------------------------------------------------------------------------
// Räume
// ---------------------------------------------------------------------------

// Ohne eigenes Icon: aus dem Namen raten (wie bisher)
function guessRoomIcon(name) {
    const lower = name.toLowerCase()
    if (lower.includes('wohn')) return 'sofa'
    if (lower.includes('schlaf')) return 'moon'
    if (lower.includes('büro') || lower.includes('buero') || lower.includes('arbeit')) {
        return 'briefcase-business'
    }
    return 'house'
}

// Schlüssel des Icons, das ein Raum gerade zeigt
export function roomIconKey(room) {
    if (room.icon && ROOM_BY_KEY.has(room.icon)) return room.icon
    return guessRoomIcon(room.room)
}

export function roomIconEntry(key) {
    return ROOM_BY_KEY.get(key) ?? ROOM_BY_KEY.get('house')
}