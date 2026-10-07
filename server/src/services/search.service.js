import { ValidationError } from '../errors/AppError.js'
import * as searchRepository from '../repositories/search.repository.js'
import { toSearchHitDto } from '../mappers/search.mapper.js'
import { LANGUAGE_LABELS } from '../mappers/books.mapper.js'
import { cleanIsbn, normalizeIsbn } from '../validation/isbn.js'

const MAX_QUERY_LENGTH = 200
const MAX_WORDS = 10
const MIN_FUZZY_LENGTH = 3     // kürzere Begriffe ergeben bei der Ähnlichkeitssuche nur Rauschen
const FUZZY_LIMIT = 50         // ähnliche Treffer: nur die besten
const MIN_YEAR_DIGITS = 2      // "19" zeigt 19xx, "1" allein wäre fast der ganze Bestand
const MIN_ISBN_DIGITS = 3
const MIN_LOCATION_LENGTH = 2  // "a" allein träfe "Regal A" und jede "Ablage"

// Reihenfolge der Tabs im Frontend. "all" ist immer dabei.
const TAB_ORDER = ['title', 'author', 'publisher', 'year', 'language', 'location', 'isbn']
const FUZZY_TABS = ['title', 'author']

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// ?q=a&q=b ergibt in Express ein Array -> Fehler
function readQuery(value) {
    if (value !== undefined && typeof value !== 'string') {
        throw new ValidationError({ q: 'Nur ein Suchbegriff erlaubt' })
    }
    const q = (value ?? '').trim()
    if (q === '') {
        throw new ValidationError({ q: 'Pflichtfeld' }, 'Suchbegriff fehlt')
    }
    if (q.length > MAX_QUERY_LENGTH) {
        throw new ValidationError({ q: `Höchstens ${MAX_QUERY_LENGTH} Zeichen` })
    }
    return q
}

// Kleinbuchstaben, Akzente und Umlaute weg ("Französisch" -> "franzosisch")
function simplify(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

// Wörter für die Text-Tabs: nur Buchstaben und Ziffern (auch Umlaute, é, ß ...).
// Alles andere trennt Wörter, so wie der 'simple'-Parser von PostgreSQL.
function splitWords(q) {
    return q
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter(word => word !== '')
        .slice(0, MAX_WORDS)
}

// Tab "Erscheinungsjahr": nur wenn nur Ziffern eingegeben wurden (2 bis 4)
function yearPrefixOf(q) {
    const pattern = new RegExp(`^[0-9]{${MIN_YEAR_DIGITS},4}$`)
    return pattern.test(q) ? q : null
}

// Tab "Sprache": ein einzelnes Wort aus Buchstaben.
// Passt auf den Anzeigenamen ("franz" -> fr) oder auf den Code selbst ("fr").
function languageMatchOf(words) {
    if (words.length !== 1 || !/^\p{L}+$/u.test(words[0])) return null

    const word = simplify(words[0])
    const codes = Object.entries(LANGUAGE_LABELS)
        .filter(([, label]) => simplify(label).startsWith(word))
        .map(([code]) => code)

    return {
        codes,
        prefix: word.length <= 3 ? word : null,   // Codes haben 2 bis 3 Buchstaben
    }
}

// Tab "ISBN": nur Ziffern, Bindestriche, Leerzeichen, X.
// Vollständige gültige ISBN -> genau diese (auch als ISBN-10 eingegeben), sonst Präfix.
function isbnMatchOf(q) {
    if (!/^[0-9Xx\s-]+$/.test(q)) return null

    const cleaned = cleanIsbn(q)
    if (cleaned.length < MIN_ISBN_DIGITS) return null

    const normalized = normalizeIsbn(cleaned)
    return {
        exact13: normalized ? normalized.isbn13 : null,
        prefix: cleaned,
    }
}

// ---------------------------------------------------------------------------
// GET /api/search?q=a
// ---------------------------------------------------------------------------

export async function search(query = {}) {
    const q = readQuery(query.q)
    const words = splitWords(q)
    const yearPrefix = yearPrefixOf(q)
    const language = languageMatchOf(words)
    const isbn = isbnMatchOf(q)

    // Welche Tabs passen überhaupt zu dieser Eingabe?
    const activeTabs = TAB_ORDER.filter(tab => {
        if (tab === 'year') return yearPrefix !== null
        if (tab === 'language') return language !== null
        if (tab === 'isbn') return isbn !== null
        if (tab === 'location') return words.length > 0 && q.length >= MIN_LOCATION_LENGTH
        return words.length > 0          // Text-Tabs brauchen mindestens ein Wort
    })

    let rows = []
    if (words.length > 0 || yearPrefix || isbn) {
        rows = await searchRepository.findAllMatches({
            words,
            locationWords: activeTabs.includes('location') ? words : [],
            yearPrefix,
            languageCodes: language?.codes ?? [],
            languagePrefix: language?.prefix ?? null,
            isbn13Exact: isbn?.exact13 ?? null,
            isbnPrefix: isbn?.prefix ?? null,
        })
    }

    const items = rows.map(toSearchHitDto)

    // Gar nichts gefunden: Tippfehler-Suche für Titel und Autor.
    // Nicht bei reinen Zahlen, das ist meist eine halb getippte ISBN oder ein Jahr.
    const fuzzyTabs = []
    const looksNumeric = /^[0-9Xx\s-]+$/.test(q)

    if (items.length === 0 && q.length >= MIN_FUZZY_LENGTH && !looksNumeric) {
        const similar = await searchRepository.findSimilar(q, FUZZY_LIMIT)
        items.push(...similar.map(toSearchHitDto))
        if (similar.length > 0) fuzzyTabs.push(...FUZZY_TABS)
    }

    const tabs = [
        { key: 'all', count: items.length, fuzzy: fuzzyTabs.length > 0 },
        ...activeTabs.map(key => ({
            key,
            count: items.filter(item => item.matches.includes(key)).length,
            fuzzy: fuzzyTabs.includes(key),
        })),
    ]

    return {
        query: q,
        total: items.length,
        tabs,
        items,
    }
}