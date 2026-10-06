import * as openlibrary from './openlibrary.js'
import * as dnb from './dnb.js'
import * as google from './google.js'

// Reihenfolge laut Plan: Open Library -> DNB -> Google Books
const PROVIDERS = [openlibrary, dnb, google]

// Ohne diese Felder ist ein Treffer unvollständig, dann wird weitergefragt
const REQUIRED_FIELDS = ['title', 'author']

function isComplete(result) {
    return REQUIRED_FIELDS.every(field => result.data[field])
}

// Fehlende Felder und ein fehlendes Cover aus einer späteren Quelle ergänzen
function fillMissing(result, hit, source) {
    for (const [field, value] of Object.entries(hit.data)) {
        if (result.data[field] == null && value != null) {
            result.data[field] = value
        }
    }
    if (!result.coverUrl && hit.coverUrl) {
        result.coverUrl = hit.coverUrl
        result.coverSource = source
    }
}

// Fragt die Quellen nacheinander ab und hört beim ersten vollständigen Treffer auf.
// Ergebnis: { result: { source, data, coverUrl, coverSource } | null, attempts: [...] }
// attempts[].status: hit | incomplete | miss | timeout | error | skipped
export async function lookupIsbn(isbn13, isbn10) {
    const attempts = []
    let result = null

    for (const provider of PROVIDERS) {
        if (result && isComplete(result)) {
            attempts.push({ source: provider.name, status: 'skipped' })
            continue
        }
        try {
            const hit = await provider.lookup(isbn13, isbn10)
            if (!hit) {
                attempts.push({ source: provider.name, status: 'miss' })
                continue
            }
            if (!result) {
                // Erste Quelle mit Treffer liefert die Hauptdaten
                result = {
                    source: provider.name,
                    data: { ...hit.data },
                    coverUrl: hit.coverUrl,
                    coverSource: hit.coverUrl ? provider.name : null,
                }
            } else {
                fillMissing(result, hit, provider.name)
            }
            const complete = REQUIRED_FIELDS.every(field => hit.data[field])
            attempts.push({ source: provider.name, status: complete ? 'hit' : 'incomplete' })
        } catch (err) {
            // Fällt eine Quelle aus, geht es mit der nächsten weiter
            const status = err.name === 'TimeoutError' ? 'timeout' : 'error'
            console.warn(`ISBN-Abruf bei ${provider.name} fehlgeschlagen (${status}): ${err.message}`)
            attempts.push({ source: provider.name, status })
        }
    }

    return { result, attempts }
}