// Gemeinsame Helfer für die ISBN-Quellen: HTTP mit Timeout und das
// Vereinheitlichen der Felder, damit alle Quellen dasselbe Format liefern.

const TIMEOUT_MS = 5000

// Open Library bittet um einen User-Agent mit Kontaktadresse
function userAgent() {
    const contact = process.env.ISBN_CONTACT_EMAIL
    return contact ? `BibliothekMama/1.0 (${contact})` : 'BibliothekMama/1.0'
}

export class ProviderHttpError extends Error {
    constructor(status) {
        super(`HTTP ${status}`)
        this.status = status
    }
}

// Bricht nach TIMEOUT_MS ab (err.name === 'TimeoutError')
export async function fetchWithTimeout(url, { accept, timeoutMs = TIMEOUT_MS } = {}) {
    return fetch(url, {
        headers: { 'User-Agent': userAgent(), ...(accept ? { Accept: accept } : {}) },
        signal: AbortSignal.timeout(timeoutMs),
    })
}

export async function fetchJson(url) {
    const res = await fetchWithTimeout(url, { accept: 'application/json' })
    if (!res.ok) throw new ProviderHttpError(res.status)
    return res.json()
}

export async function fetchText(url) {
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new ProviderHttpError(res.status)
    return res.text()
}

// ---------------------------------------------------------------------------
// Felder vereinheitlichen
// ---------------------------------------------------------------------------

// Trimmen, Satzzeichen am Ende entfernen ("Diogenes :" -> "Diogenes"),
// leere Werte werden zu null
export function cleanText(value) {
    if (typeof value !== 'string') return null
    const text = value
        .replace(/[\u0098\u009C¬]/g, '')        // Nichtsortier-Zeichen aus MARC ("¬Das¬ Parfum")
        .replace(/\s+/g, ' ')
        .replace(/^[\s[]+|[\s\]/:;,.=]+$/g, '') // Klammern und Satzzeichen an den Rändern
        .trim()
    return text === '' ? null : text
}

// Erste plausible Jahreszahl: "1994", "March 1994", "[1994]", "c1994", "1994-01-01"
export function parseYear(value) {
    if (typeof value === 'number') value = String(value)
    if (typeof value !== 'string') return null
    const match = value.match(/(?<!\d)(1[4-9]\d{2}|20\d{2}|2100)(?!\d)/)
    return match ? Number(match[1]) : null
}

export function parsePages(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value) && value > 0 ? value : null
    }
    if (typeof value !== 'string') return null
    // "319 S.", "XII, 319 Seiten", "320 p." -> Zahl vor der Seitenangabe
    const match = value.match(/(\d+)\s*(?:S\.|S\b|Seiten|p\.|pages)/i) ?? value.match(/(\d+)/)
    const pages = match ? Number(match[1]) : null
    return pages > 0 ? pages : null
}

// MARC/ISO 639-2 (3 Buchstaben) -> ISO 639-1, wie in der Datenbank verwendet
const LANGUAGE_MAP = {
    ger: 'de', deu: 'de', eng: 'en', fre: 'fr', fra: 'fr', ita: 'it', spa: 'es',
    por: 'pt', dut: 'nl', nld: 'nl', lat: 'la', rus: 'ru', swe: 'sv', dan: 'da',
    nor: 'no', pol: 'pl', gre: 'el', ell: 'el', tur: 'tr', hun: 'hu', cze: 'cs',
    ces: 'cs', fin: 'fi', roh: 'rm', jpn: 'ja', chi: 'zh', zho: 'zh',
}

// Akzeptiert "ger", "de", "de-CH", "/languages/ger"
export function toLanguageCode(value) {
    if (typeof value !== 'string') return null
    const code = value.split('/').pop().split('-')[0].trim().toLowerCase()
    if (LANGUAGE_MAP[code]) return LANGUAGE_MAP[code]
    return /^[a-z]{2,3}$/.test(code) && code !== 'und' && code !== 'mul' ? code : null
}

// Einheitliches Ergebnis aller Quellen. Mehrere Autoren kommagetrennt (wie in der DB).
export function buildData({ title, subtitle, authors, publisher, year, language, pages }) {
    const authorList = [...new Set((authors ?? []).map(cleanText).filter(Boolean))]
    return {
        title: cleanText(title),
        subtitle: cleanText(subtitle),
        author: authorList.length > 0 ? authorList.join(', ') : null,
        publisher: cleanText(publisher),
        publishedYear: parseYear(year),
        language: toLanguageCode(language),
        pages: parsePages(pages),
    }
}