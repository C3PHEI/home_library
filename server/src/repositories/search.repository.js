import { pool } from '../db/pool.js'

// Spalten für einen Treffer: Listeneintrag + Standort (wie GET /api/books)
const HIT_COLUMNS = `
    b.id, b.title, b.author, b.published_year, b.language, b.isbn13, b.cover_path, b.loaned_to,
    b.shelf_slot_id, b.slot_label, b.furniture_id, b.furniture_name, b.room`

// Alle Treffer auf einmal. Für jedes Buch wird pro Tab ausgerechnet, ob es passt
// (m_title, m_author ...). Das Frontend filtert die Tabs dann selbst aus "matches".
//
// Text-Tabs: jedes Wort ist ein Präfix ("par" findet "Das Parfum"), alle Wörter
// müssen im selben Feld vorkommen. m_combined (Titel + Autor zusammen) sorgt dafür,
// dass "parfum süskind" im Tab "Alle" trotzdem gefunden wird.
//
// Parameter, die für eine Eingabe nicht passen, kommen als null bzw. leeres Array.
// NULL in einer Bedingung ergibt NULL, COALESCE macht daraus false.
export async function findAllMatches({ words, locationWords, yearPrefix, languageCodes, languagePrefix, isbn13Exact, isbnPrefix }) {
    const { rows } = await pool.query(
        `WITH q AS (
             SELECT to_tsquery('simple', string_agg(f_unaccent(w) || ':*', ' & ')) AS query
               FROM unnest($1::text[]) AS w
         ),
         lq AS (   -- Standort: eigene Wortliste, bei einem einzelnen Buchstaben leer
             SELECT to_tsquery('simple', string_agg(f_unaccent(w) || ':*', ' & ')) AS query
               FROM unnest($7::text[]) AS w
         ),
         hits AS (
             SELECT ${HIT_COLUMNS},
                    COALESCE(to_tsvector('simple', f_unaccent(b.title))     @@ q.query, false) AS m_title,
                    COALESCE(to_tsvector('simple', f_unaccent(b.author))    @@ q.query, false) AS m_author,
                    COALESCE(to_tsvector('simple', f_unaccent(b.publisher)) @@ q.query, false) AS m_publisher,
                    COALESCE(to_tsvector('simple', f_unaccent(
                                 concat_ws(' ', b.furniture_name, b.slot_label, b.room))) @@ lq.query, false) AS m_location,
                    COALESCE(b.published_year::text LIKE $2 || '%', false)                AS m_year,
                    COALESCE(b.language = ANY($3::text[]) OR b.language LIKE $4 || '%', false) AS m_language,
                    COALESCE(b.isbn13 = $5
                             OR b.isbn13 LIKE $6 || '%'
                             OR b.isbn10 LIKE $6 || '%', false)                           AS m_isbn,
                    COALESCE(b.search_vector @@ q.query, false)                           AS m_combined
               FROM book_with_location b
              CROSS JOIN q
              CROSS JOIN lq
         )
         SELECT *
           FROM hits
          WHERE m_title OR m_author OR m_publisher OR m_location
             OR m_year OR m_language OR m_isbn OR m_combined
          ORDER BY lower(title), id`,
        [words, yearPrefix, languageCodes, languagePrefix, isbn13Exact, isbnPrefix, locationWords]
    )
    return rows
}

// Tippfehler-Suche mit pg_trgm, nur für Titel und Autor.
// <% nutzt pg_trgm.word_similarity_threshold (0.3, setzt 01_schema.sql) und die
// Trigramm-Indizes. Die Ausdrücke müssen exakt wie im Index lauten: f_unaccent(lower(...)).
export async function findSimilar(term, limit) {
    const { rows } = await pool.query(
        `SELECT ${HIT_COLUMNS},
                f_unaccent(lower($1)) <% f_unaccent(lower(b.title))  AS m_title,
             f_unaccent(lower($1)) <% f_unaccent(lower(b.author)) AS m_author
         FROM book_with_location b
         WHERE f_unaccent(lower($1)) <% f_unaccent(lower(b.title))
            OR f_unaccent(lower($1)) <% f_unaccent(lower(b.author))
         ORDER BY GREATEST(
             word_similarity(f_unaccent(lower($1)), f_unaccent(lower(b.title))),
             word_similarity(f_unaccent(lower($1)), f_unaccent(lower(b.author)))
             ) DESC,
             lower(b.title), b.id
             LIMIT $2`,
        [term, limit]
    )
    return rows
}