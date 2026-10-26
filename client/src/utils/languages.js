// Sprachen für das Dropdown. Gleiche Codes und Namen wie LANGUAGE_LABELS
// im Backend (server/src/mappers/books.mapper.js).
export const LANGUAGES = [
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Französisch' },
    { code: 'en', label: 'Englisch' },
    { code: 'it', label: 'Italienisch' },
    { code: 'es', label: 'Spanisch' },
]

// Unbekannte Codes (z. B. "nl" aus dem ISBN-Abruf) zeigen den Code selbst
export function languageLabel(code) {
    return LANGUAGES.find((language) => language.code === code)?.label ?? code
}