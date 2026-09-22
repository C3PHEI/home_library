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