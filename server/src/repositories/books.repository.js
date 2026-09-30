import { pool } from '../db/pool.js'

// Whitelist: nur diese Ausdrücke landen im ORDER BY
const SORT_COLUMNS = {
    title: 'lower(title)',
    author: 'lower(author)',
    year: 'published_year',
    created: 'created_at',
}

// WHERE-Teil und Parameter nur aus den gesetzten Filtern bauen
function buildWhere(filters) {
    const conditions = []
    const params = []

    if (filters.author !== undefined) {
        params.push(filters.author)
        conditions.push(`author = $${params.length}`)
    }
    if (filters.language !== undefined) {
        params.push(filters.language)
        conditions.push(`language = $${params.length}`)
    }
    if (filters.year !== undefined) {
        params.push(filters.year)
        conditions.push(`published_year = $${params.length}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return { where, params }
}

export async function countBooks(filters) {
    const { where, params } = buildWhere(filters)
    const { rows } = await pool.query(
        `SELECT count(*)::int AS total FROM book ${where}`,
        params
    )
    return rows[0].total
}

export async function findBooks(filters, sort, dir, limit, offset) {
    const { where, params } = buildWhere(filters)
    const orderBy = SORT_COLUMNS[sort] ?? SORT_COLUMNS.title
    const direction = dir === 'desc' ? 'DESC' : 'ASC'

    params.push(limit, offset)
    const limitIdx = params.length - 1
    const offsetIdx = params.length

    const { rows } = await pool.query(
        `SELECT id, title, author, published_year, language, isbn13, cover_path, loaned_to,
                shelf_slot_id, slot_label, furniture_id, furniture_name, room
           FROM book_with_location
           ${where}
          ORDER BY ${orderBy} ${direction} NULLS LAST, id
          LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
    )
    return rows
}

// Werte für die Filter-Dropdowns, jeweils mit Anzahl Bücher
export async function findDistinctAuthors() {
    const { rows } = await pool.query(
        `SELECT author AS value, count(*)::int AS count
           FROM book
          GROUP BY author
          ORDER BY lower(author)`
    )
    return rows
}

export async function findDistinctLanguages() {
    const { rows } = await pool.query(
        `SELECT language AS value, count(*)::int AS count
           FROM book
          WHERE language IS NOT NULL
          GROUP BY language
          ORDER BY count(*) DESC, language`
    )
    return rows
}

export async function findDistinctYears() {
    const { rows } = await pool.query(
        `SELECT published_year AS value, count(*)::int AS count
           FROM book
          WHERE published_year IS NOT NULL
          GROUP BY published_year
          ORDER BY published_year DESC`
    )
    return rows
}

export async function findById(id) {
    const { rows } = await pool.query(
        `SELECT id, title, author, isbn13, isbn10, publisher, published_year, language, pages,
                note, cover_path, cover_source, loaned_to,
                loaned_since::text AS loaned_since,   -- 'YYYY-MM-DD', sonst verschiebt die Zeitzone den Tag
                created_at, updated_at,
                shelf_slot_id, slot_label, furniture_id, furniture_name, furniture_type, room
           FROM book_with_location
          WHERE id = $1`,
        [id]
    )
    return rows[0] ?? null
}

export async function slotExists(slotId) {
    const { rows } = await pool.query('SELECT 1 FROM shelf_slot WHERE id = $1', [slotId])
    return rows.length > 0
}

export async function findByIsbn13(isbn13) {
    const { rows } = await pool.query(
        `SELECT id, title, author, slot_label, furniture_name, room
           FROM book_with_location
          WHERE isbn13 = $1
          ORDER BY id`,
        [isbn13]
    )
    return rows
}

export async function insertBook(data) {
    const { rows } = await pool.query(
        `INSERT INTO book (title, author, isbn13, isbn10, publisher, published_year,
                           language, pages, note, shelf_slot_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
            data.title, data.author, data.isbn13, data.isbn10, data.publisher,
            data.publishedYear, data.language, data.pages, data.note, data.shelfSlotId,
        ]
    )
    return rows[0].id
}

export async function updateBookSlot(id, slotId) {
    const { rowCount } = await pool.query(
        'UPDATE book SET shelf_slot_id = $1 WHERE id = $2',
        [slotId, id]
    )
    return rowCount > 0
}

// Whitelist: nur diese Spalten dürfen per PATCH geändert werden
const UPDATABLE_COLUMNS = {
    title: 'title',
    author: 'author',
    isbn13: 'isbn13',
    isbn10: 'isbn10',
    publisher: 'publisher',
    publishedYear: 'published_year',
    language: 'language',
    pages: 'pages',
    note: 'note',
}

// Ändert nur die übergebenen Felder. Gibt false zurück, wenn es das Buch nicht gibt.
export async function updateBook(id, changes) {
    const sets = []
    const params = []
    for (const [key, value] of Object.entries(changes)) {
        const column = UPDATABLE_COLUMNS[key]
        if (!column) continue
        params.push(value)
        sets.push(`${column} = $${params.length}`)
    }

    params.push(id)
    const { rowCount } = await pool.query(
        `UPDATE book SET ${sets.join(', ')} WHERE id = $${params.length}`,
        params
    )
    return rowCount > 0
}