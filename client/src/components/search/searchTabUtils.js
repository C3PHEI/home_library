// Anzeigenamen für die Tab-Schlüssel aus GET /api/search
export const TAB_LABELS = {
    all: 'Alle',
    title: 'Titel',
    author: 'Autor',
    publisher: 'Verlag',
    year: 'Erscheinungsjahr',
    language: 'Sprache',
    location: 'Standort',
    isbn: 'ISBN',
}

export function tabLabel(key) {
    return TAB_LABELS[key] ?? key
}

// Tabs, die sich lohnen: "Alle" immer, die anderen nur mit mindestens einem Treffer
export function visibleTabs(tabs) {
    return tabs.filter((tab) => tab.key === 'all' || tab.count > 0)
}

// Leiste nur zeigen, wenn sie etwas bringt: bei "Autor 2" allein (= Alle 2) nicht
export function hasUsefulTabs(tabs, total) {
    const filters = tabs.filter((tab) => tab.key !== 'all')
    return filters.length >= 2 || filters.some((tab) => tab.count < total)
}