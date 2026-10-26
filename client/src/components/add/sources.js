// Quellen des ISBN-Abrufs in der Reihenfolge des Backends
// (server/src/services/isbnLookup/index.js)
export const SOURCES = [
    { key: 'openlibrary', label: 'Open Library', listLabel: 'Open Library' },
    { key: 'dnb', label: 'DNB', listLabel: 'DNB (SRU)' },
    { key: 'google', label: 'Google Books', listLabel: 'Google Books' },
]

// "openlibrary" -> "Open Library"
export function sourceLabel(key) {
    return SOURCES.find((source) => source.key === key)?.label ?? key
}

// attempts[].status aus GET /api/isbn -> Text in der Box "Abrufreihenfolge"
export const ATTEMPT_LABELS = {
    hit: 'Treffer',
    incomplete: 'Treffer, unvollständig',
    miss: 'nicht gefunden',
    timeout: 'keine Antwort',
    error: 'nicht erreichbar',
    skipped: 'nicht nötig',
}

// Gab es einen Ausfall? Dann lohnt sich ein zweiter Versuch.
export function hadSourceFailure(attempts) {
    return attempts.some((attempt) => attempt.status === 'timeout' || attempt.status === 'error')
}