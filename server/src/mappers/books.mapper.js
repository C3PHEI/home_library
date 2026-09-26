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

// Anzeigenamen für die häufigsten Sprachcodes. Unbekannte Codes zeigen den Code selbst.
const LANGUAGE_LABELS = {
    de: 'Deutsch',
    fr: 'Französisch',
    en: 'Englisch',
    it: 'Italienisch',
    es: 'Spanisch',
}

export function toFilterOptionsDto(authors, languages, years) {
    return {
        authors: authors.map(r => ({ value: r.value, count: r.count })),
        languages: languages.map(r => ({
            value: r.value,
            label: LANGUAGE_LABELS[r.value] ?? r.value,
            count: r.count,
        })),
        years: years.map(r => ({ value: r.value, count: r.count })),
    }
}