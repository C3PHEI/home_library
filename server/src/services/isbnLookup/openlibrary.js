import { createRateLimiter } from '../rateLimiter.js'
import { buildData, fetchJson } from './common.js'

export const name = 'openlibrary'

// Open Library erlaubt ohne Anmeldung etwa 1 Anfrage pro Sekunde
const limit = createRateLimiter(1000)

// Ergebnis: { data, coverUrl } oder null, wenn das Buch dort fehlt
export async function lookup(isbn13, isbn10) {
    const keys = [isbn13, isbn10].filter(Boolean).map(isbn => `ISBN:${isbn}`)
    const url = `https://openlibrary.org/api/books?bibkeys=${keys.join(',')}&format=json&jscmd=details`

    const json = await limit(() => fetchJson(url))
    const details = keys.map(key => json?.[key]?.details).find(d => d?.title)
    if (!details) return null

    const authors = (details.authors ?? []).map(a => a?.name).filter(Boolean)
    if (authors.length === 0 && details.by_statement) {
        authors.push(details.by_statement)
    }

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