// Doppelte Exemplare unter den Treffern finden.
// Jedes Exemplar ist ein eigener Eintrag in der Datenbank (01_schema.sql: "Zwei gleiche
// Bücher = zwei Zeilen"). Gleich sind zwei Treffer mit derselben ISBN-13, ohne ISBN
// mit gleichem Titel und Autor (Gross-/Kleinschreibung und Leerzeichen egal).
export function findDuplicateGroups(items) {
    const groups = new Map()

    for (const book of items) {
        const key = duplicateKey(book)
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(book)
    }

    return [...groups.values()].filter((group) => group.length > 1)
}

function duplicateKey(book) {
    if (book.isbn13) return `isbn:${book.isbn13}`
    return `text:${normalize(book.title)}|${normalize(book.author)}`
}

function normalize(text) {
    return (text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}