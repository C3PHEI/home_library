import {pool} from "../db/pool.js";

export async function findHeaderById(id) {
    const sql = `
    SELECT s.id,
           s.label,
           f.id         AS furniture_id,
           f.name       AS furniture_name,
           f.room,
           COUNT(b.id)::int AS book_count
    FROM shelf_slot s
    JOIN furniture f   ON f.id = s.furniture_id
    LEFT JOIN book b   ON b.shelf_slot_id = s.id
    WHERE s.id = $1
    GROUP BY s.id, f.id
  `;

    const { rows } = await pool.query(sql, [id]);
    return rows[0] ?? null;
}

const SORT_COLUMNS = {
    title: 'lower(title)',
    author: 'lower(author)',
    year: 'published_year',
    created: 'created_at',
};

// Titelsuche: Teilwort irgendwo im Titel (Anfang, Mitte, Ende),
// ohne Gross/Klein und ohne Akzente ("ecole" findet "École").
// % und _ im Suchtext werden maskiert, damit sie als normale Zeichen gelten.
// $2 ist NULL, wenn nicht gesucht wird -> alle Bücher des Fachs.
const TITLE_FILTER = `
    AND ($2::text IS NULL
         OR f_unaccent(lower(title)) LIKE '%' || f_unaccent(lower($2::text)) || '%')`;

function toLikeParam(titleQuery) {
    return titleQuery ? titleQuery.replace(/[\\%_]/g, '\\$&') : null;
}

export async function countBooks(slotId, titleQuery = null) {
    const { rows } = await pool.query(
        `SELECT count(*)::int AS total
           FROM book
          WHERE shelf_slot_id = $1 ${TITLE_FILTER}`,
        [slotId, toLikeParam(titleQuery)]
    );
    return rows[0].total;
}

export async function findBooks(slotId, sort, limit, offset, titleQuery = null) {
    const orderBy = SORT_COLUMNS[sort] ?? SORT_COLUMNS.title;

    const { rows } = await pool.query(
        `SELECT id, title, author, published_year, language, isbn13, cover_path, loaned_to
       FROM book
      WHERE shelf_slot_id = $1 ${TITLE_FILTER}
      ORDER BY ${orderBy}, id
      LIMIT $3 OFFSET $4`,
        [slotId, toLikeParam(titleQuery), limit, offset]
    );
    return rows;
}

export async function findBooks(slotId, sort, limit, offset) {
    const orderBy = SORT_COLUMNS[sort] ?? SORT_COLUMNS.title;

    const { rows } = await pool.query(
        `SELECT id, title, author, published_year, language, isbn13, cover_path, loaned_to
       FROM book
      WHERE shelf_slot_id = $1
      ORDER BY ${orderBy}, id
      LIMIT $2 OFFSET $3`,
        [slotId, limit, offset]
    );
    return rows;
}