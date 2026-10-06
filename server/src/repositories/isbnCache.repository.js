import { pool } from '../db/pool.js'

// Treffer bleiben lange gültig, "nicht gefunden" nur einige Tage
const FOUND_MAX_AGE = '180 days'
const NOT_FOUND_MAX_AGE = '7 days'

// Gültiger Cache-Eintrag oder null
export async function findFresh(isbn13) {
    const { rows } = await pool.query(
        `SELECT isbn13, source, found, payload, fetched_at
           FROM isbn_lookup_cache
          WHERE isbn13 = $1
            AND fetched_at > now() - (CASE WHEN found THEN $2 ELSE $3 END)::interval`,
        [isbn13, FOUND_MAX_AGE, NOT_FOUND_MAX_AGE]
    )
    return rows[0] ?? null
}

export async function save(isbn13, source, payload) {
    const { rows } = await pool.query(
        `INSERT INTO isbn_lookup_cache (isbn13, source, found, payload, fetched_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (isbn13) DO UPDATE
            SET source = EXCLUDED.source,
                found = EXCLUDED.found,
                payload = EXCLUDED.payload,
                fetched_at = EXCLUDED.fetched_at
         RETURNING fetched_at`,
        [isbn13, source, source !== null, payload]
    )
    return rows[0].fetched_at
}