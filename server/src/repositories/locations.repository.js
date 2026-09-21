import { pool } from '../db/pool.js'

// Eine Zeile pro Reihe (Slot), mit Möbel, Raum und Anzahl Bücher.
// Möbel ohne Reihe erscheinen einmal mit slot_id = NULL.
export async function findAllWithBookCounts(roomOrder) {
    const { rows } = await pool.query(
        `SELECT f.id    AS furniture_id,
                f.name  AS furniture_name,
                f.type  AS furniture_type,
                f.room,
                s.id    AS slot_id,
                s.label AS slot_label,
                COALESCE(bc.cnt, 0)::int AS book_count
         FROM furniture f
                  LEFT JOIN shelf_slot s ON s.furniture_id = f.id
                  LEFT JOIN (
             SELECT shelf_slot_id, COUNT(*) AS cnt
             FROM book
             GROUP BY shelf_slot_id
         ) bc ON bc.shelf_slot_id = s.id
         ORDER BY array_position($1::text[], f.room), f.room,
                  f.sort_order, f.id, s.sort_order, s.id`,
        [roomOrder]
    )
    return rows
}