import {
    Archive,
    Armchair,
    Baby,
    Bath,
    BedDouble,
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
    Warehouse,
} from 'lucide-react'

// Icons, die man einem Möbelstück geben kann, in Gruppen für die Auswahl.
// key wird in furniture.icon gespeichert. Neues Icon auch im Backend
// eintragen: server/src/validation/furnitureIcons.js
export const FURNITURE_ICON_GROUPS = [
    {
        label: 'Möbel',
        icons: [
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
        ],
    },
    {
        label: 'Räume',
        icons: [
            { key: 'house', label: 'Haus', Icon: House },
            { key: 'briefcase-business', label: 'Büro', Icon: BriefcaseBusiness },
            { key: 'cooking-pot', label: 'Küche', Icon: CookingPot },
            { key: 'bath', label: 'Bad', Icon: Bath },
            { key: 'baby', label: 'Kinderzimmer', Icon: Baby },
            { key: 'warehouse', label: 'Keller oder Estrich', Icon: Warehouse },
            { key: 'car', label: 'Garage', Icon: Car },
            { key: 'trees', label: 'Garten', Icon: Trees },
        ],
    },
]

const ICON_BY_KEY = new Map(
    FURNITURE_ICON_GROUPS.flatMap((group) => group.icons).map((entry) => [entry.key, entry]),
)

// Ohne eigenes Icon: Standard nach Möbeltyp (wie bisher)
const DEFAULT_ICON_BY_TYPE = {
    shelf: 'book-open',
    cabinet: 'door-open',
    table: 'sofa',
    nightstand: 'moon',
    other: 'archive',
}

// Schlüssel des Icons, das ein Möbel gerade zeigt
export function furnitureIconKey(furniture) {
    if (furniture.icon && ICON_BY_KEY.has(furniture.icon)) return furniture.icon
    return DEFAULT_ICON_BY_TYPE[furniture.type] ?? 'book-open'
}

// 'sofa' -> { key, label, Icon }
export function furnitureIconEntry(key) {
    return ICON_BY_KEY.get(key) ?? ICON_BY_KEY.get('book-open')
}