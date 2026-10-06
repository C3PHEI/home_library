import { createRateLimiter } from '../rateLimiter.js'
import { buildData, fetchJson } from './common.js'

export const name = 'openlibrary'

// Open Library erlaubt mit Kontakt im User-Agent bis zu 3 Anfragen pro Sekunde
const limit = createRateLimiter(500)

const BASE = 'https://openlibrary.org'
const AUTHOR_KEY_RE = /^\/authors\/OL\d+A$/
const WORK_KEY_RE = /^\/works\/OL\d+W$/
const MAX_AUTHORS = 3

// Ergebnis: { data, coverUrl } oder null, wenn das Buch dort fehlt
export async function lookup(isbn13, isbn10) {
    const keys = [isbn13, isbn10].filter(Boolean).map(isbn => `ISBN:${isbn}`)
    const url = `${BASE}/api/books?bibkeys=${keys.join(',')}&format=json&jscmd=details`

    const json = await limit(() => fetchJson(url))
    const details = keys.map(key => json?.[key]?.details).find(d => d?.title)
    if (!details) return null

    const authors = await resolveAuthors(details)

    const publisher = details.publishers?.[0]
    // Cover über die Cover-ID statt über die ISBN laden, sonst greift das Limit
    // von 100 Anfragen pro 5 Minuten. -1 bedeutet "kein Cover".
    const coverId = (details.covers ?? []).find(id => Number.isInteger(id) && id > 0)

    return {
        data: buildData({
            title: details.title,
            subtitle: details.subtitle,
            authors,
            publisher: typeof publisher === 'string' ? publisher : publisher?.name,
            year: details.publish_date,
            language: details.languages?.[0]?.key,
            pages: details.number_of_pages ?? details.pagination,
        }),
        coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
    }
}

// Die Ausgabe (edition) enthält meist nur Verweise wie { key: "/authors/OL123A" }
// ohne Namen. Die Namen stehen im Autor-Datensatz. Hat die Ausgabe gar keine
// Autoren, stehen sie beim Werk (work).
async function resolveAuthors(details) {
    const named = (details.authors ?? []).map(a => a?.name).filter(Boolean)
    if (named.length > 0) return named

    let authorKeys = (details.authors ?? []).map(a => a?.key)
    if (authorKeys.length === 0) {
        authorKeys = await authorKeysFromWork(details.works?.[0]?.key)
    }

    const names = []
    for (const key of authorKeys.filter(k => AUTHOR_KEY_RE.test(k ?? '')).slice(0, MAX_AUTHORS)) {
        try {
            const author = await limit(() => fetchJson(`${BASE}${key}.json`))
            if (author?.name) names.push(author.name)
        } catch (err) {
            console.warn(`Open Library: Autor ${key} nicht geladen: ${err.message}`)
        }
    }

    // Letzter Ausweg: Verfasserangabe aus der Ausgabe, z. B. "Patrick Süskind."
    if (names.length === 0 && details.by_statement) {
        names.push(details.by_statement)
    }
    return names
}

async function authorKeysFromWork(workKey) {
    if (!WORK_KEY_RE.test(workKey ?? '')) return []
    try {
        const work = await limit(() => fetchJson(`${BASE}${workKey}.json`))
        return (work?.authors ?? []).map(a => a?.author?.key)
    } catch (err) {
        console.warn(`Open Library: Werk ${workKey} nicht geladen: ${err.message}`)
        return []
    }
}