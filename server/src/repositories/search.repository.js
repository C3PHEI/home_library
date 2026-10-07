import { pool } from '../db/pool.js'

// Spalten für einen Treffer: Listeneintrag + Standort (wie GET /api/books)
const HIT_COLUMNS = `
    id, title, author, published_year, language, isbn13, cover_path, loaned_to,
    shelf_slot_id, slot_label, furniture_id, furniture_name, room`

// 1. Exakte ISBN-Suche. Nicht anwendbare Form als null übergeben.
export async function findByIsbn(isbn13, isbn10, limit) {
    const { rows } = await pool.query(
        `SELECT ${HIT_COLUMNS},
                count(*) OVER ()::int AS total
           FROM book_with_location
          WHERE isbn13 = $1 OR isbn10 = $2
          ORDER BY lower(title), id
          LIMIT $3`,
        [isbn13, isbn10, limit]
    )
    return rows
}

// 2. Volltextsuche über den GIN-Index auf search_vector.
export async function findByFullText(words, limit) {
    const { rows } = await pool.query(
        `WITH q AS (
             SELECT to_tsquery('simple', string_agg(f_unaccent(w) || ':*', ' & ')) AS query
               FROM unnest($1::text[]) AS w
         )
         SELECT ${HIT_COLUMNS},
                count(*) OVER ()::int AS total
           FROM book_with_location b, q
          WHERE b.search_vector @@ q.query
          ORDER BY ts_rank(b.search_vector, q.query) DESC, lower(b.title), b.id
          LIMIT $2`,
        [words, limit]
    )
    return rows
}

// 3. Tippfehler-Suche mit pg_trgm. <% nutzt pg_trgm.word_similarity_threshold
//    (0.3, setzt 01_schema.sql) und die Trigramm-Indizes auf Titel und Autor.
export async function findBySimilarity(term, limit) {
    const { rows } = await pool.query(
        `SELECT ${HIT_COLUMNS},
                count(*) OVER ()::int AS total
           FROM book_with_location
          WHERE f_unaccent(lower($1)) <% f_unaccent(lower(title))
             OR f_unaccent(lower($1)) <% f_unaccent(lower(author))
          ORDER BY GREATEST(
                       word_similarity(f_unaccent(lower($1)), f_unaccent(lower(title))),
                       word_similarity(f_unaccent(lower($1)), f_unaccent(lower(author)))
                   ) DESC,
                   lower(title), id
          LIMIT $2`,
        [term, limit]
    )
    return rows
}