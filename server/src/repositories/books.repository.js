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