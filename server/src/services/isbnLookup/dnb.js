import { createRateLimiter } from '../rateLimiter.js'
import { buildData, fetchText, fetchWithTimeout } from './common.js'

export const name = 'dnb'

const limit = createRateLimiter(500)

// ---------------------------------------------------------------------------
// Kleiner MARC21-XML-Leser. Die DNB liefert immer dasselbe, wohlgeformte
// Format, darum reichen reguläre Ausdrücke und es braucht keine XML-Bibliothek.
// ---------------------------------------------------------------------------

function decodeXml(text) {
    return text
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&amp;/g, '&')
}

function attr(attrs, attrName) {
    return attrs.match(new RegExp(`\\b${attrName}="([^"]*)"`))?.[1]
}

// Alle Datenfelder eines Tags: [{ ind1, ind2, sub: { a: ['...'], b: [...] } }]
function datafields(xml, tag) {
    const fields = []
    const fieldRe = /<(?:\w+:)?datafield\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?datafield>/g
    for (const [, attrs, body] of xml.matchAll(fieldRe)) {
        if (attr(attrs, 'tag') !== tag) continue
        const sub = {}
        const subRe = /<(?:\w+:)?subfield\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?subfield>/g
        for (const [, subAttrs, value] of body.matchAll(subRe)) {
            const code = attr(subAttrs, 'code')
            ;(sub[code] ??= []).push(decodeXml(value))
        }
        fields.push({ ind1: attr(attrs, 'ind1'), ind2: attr(attrs, 'ind2'), sub })
    }
    return fields
}

function controlfield(xml, tag) {
    const re = new RegExp(`<(?:\\w+:)?controlfield\\b[^>]*\\btag="${tag}"[^>]*>([\\s\\S]*?)</(?:\\w+:)?controlfield>`)
    const match = xml.match(re)
    return match ? decodeXml(match[1]) : null
}

// "Süskind, Patrick" -> "Patrick Süskind" (sonst stört das Komma die Autorenliste)
function displayName(name) {
    const parts = name.split(',').map(p => p.trim()).filter(Boolean)
    return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name
}

function isAuthor(field) {
    const roles = [...(field.sub['4'] ?? []), ...(field.sub.e ?? [])].map(r => r.toLowerCase())
    return roles.length === 0 || roles.some(r => r === 'aut' || r.startsWith('verfasser'))
}

// ---------------------------------------------------------------------------

export async function lookup(isbn13) {
    const params = new URLSearchParams({
        version: '1.1',
        operation: 'searchRetrieve',
        query: `num=${isbn13}`,
        recordSchema: 'MARC21-xml',
        maximumRecords: '1',
    })
    const xml = await limit(() => fetchText(`https://services.dnb.de/sru/dnb?${params}`))

    if (/<(?:\w+:)?diagnostics\b/.test(xml)) {
        throw new Error('SRU-Fehlermeldung der DNB')
    }
    const count = Number(xml.match(/<(?:\w+:)?numberOfRecords>(\d+)</)?.[1] ?? 0)
    if (count === 0) return null

    const title = datafields(xml, '245')[0]?.sub
    if (!title?.a) return null

    const authorFields = [...datafields(xml, '100'), ...datafields(xml, '700').filter(isAuthor)]
    const authors = authorFields.map(f => f.sub.a?.[0]).filter(Boolean).map(displayName)
    if (authors.length === 0 && title.c) {
        authors.push(title.c[0])  // Verfasserangabe aus dem Titel, z. B. "Patrick Süskind"
    }

    // Verlag und Jahr: 264 mit 2. Indikator 1 (Veröffentlichung), ältere Datensätze 260
    const imprint = datafields(xml, '264').find(f => f.ind2 === '1')?.sub ?? datafields(xml, '260')[0]?.sub ?? {}
    const fixed = controlfield(xml, '008') ?? ''

    return {
        data: buildData({
            title: title.a[0],
            subtitle: title.b?.[0],
            authors,
            publisher: imprint.b?.[0],
            year: imprint.c?.[0] ?? fixed.slice(7, 11),
            language: datafields(xml, '041')[0]?.sub.a?.[0] ?? fixed.slice(35, 38),
            pages: datafields(xml, '300')[0]?.sub.a?.[0],
        }),
        coverUrl: await findCover(isbn13),
    }
}

// Der Cover-Dienst der DNB liefert nicht für jedes Buch ein Bild.
// Darum prüfen, ob wirklich ein Bild zurückkommt.
async function findCover(isbn13) {
    const url = `https://portal.dnb.de/opac/mvb/cover?isbn=${isbn13}`
    try {
        const res = await limit(() => fetchWithTimeout(url, { timeoutMs: 3000 }))
        const isImage = res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')
        await res.body?.cancel()
        return isImage ? url : null
    } catch {
        return null
    }
}