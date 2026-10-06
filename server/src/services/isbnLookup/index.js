import * as openlibrary from './openlibrary.js'
import * as dnb from './dnb.js'
import * as google from './google.js'

// Reihenfolge laut Plan: Open Library -> DNB -> Google Books
const PROVIDERS = [openlibrary, dnb, google]

// attempts[].status: hit | miss | timeout | error | skipped
export async function lookupIsbn(isbn13, isbn10) {
    const attempts = []
    let result = null

    for (const provider of PROVIDERS) {
        if (result) {
            attempts.push({ source: provider.name, status: 'skipped' })
            continue
        }
        try {
            const hit = await provider.lookup(isbn13, isbn10)
            if (hit) {
                result = { source: provider.name, ...hit }
                attempts.push({ source: provider.name, status: 'hit' })
            } else {
                attempts.push({ source: provider.name, status: 'miss' })
            }
        } catch (err) {
            // Fällt eine Quelle aus, geht es mit der nächsten weiter
            const status = err.name === 'TimeoutError' ? 'timeout' : 'error'
            console.warn(`ISBN-Abruf bei ${provider.name} fehlgeschlagen (${status}): ${err.message}`)
            attempts.push({ source: provider.name, status })
        }
    }

    return { result, attempts }
}