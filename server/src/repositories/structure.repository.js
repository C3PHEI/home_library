import { pool } from '../db/pool.js'

// Räume, Möbel und Fächer umbenennen und löschen.
// Ein Raum ist keine eigene Tabelle, sondern die Spalte furniture.room.

// ---------------------------------------------------------------------------
// Umbenennen
// ---------------------------------------------------------------------------

// Gibt es schon einen anderen Raum mit diesem Namen (Gross/klein egal)?
export async function otherRoomExists(name, exceptRoom) {
    const { rows } = await pool.query(
        `SELECT 1 FROM furniture
          WHERE lower(room) = lower($1) AND room <> $2
          LIMIT 1`,
        [name, exceptRoom]
    )
    return rows.length > 0
}

// Gibt die Anzahl umbenannter Möbel zurück (0 = Raum gibt es nicht)
export async function renameRoom(oldName, newName) {
    const { rowCount } = await pool.query(
        'UPDATE furniture SET room = $2 WHERE room = $1',
        [oldName, newName]
    )
    return rowCount
}

export async function renameFurniture(id, name) {
    const { rows } = await pool.query(
        'UPDATE furniture SET name = $2 WHERE id = $1 RETURNING id, name',
        [id, name]
    )
    return rows[0] ?? null
}

export async function renameSlot(id, label) {
    const { rows } = await pool.query(
        'UPDATE shelf_slot SET label = $2 WHERE id = $1 RETURNING id, label',
        [id, label]
    )
    return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// Löschen: alle Funktionen laufen in einer Transaktion (client).
// FOR UPDATE sperrt die Zeilen, damit niemand gleichzeitig ein Buch
// in ein Fach legt, das gerade gelöscht wird.
// ---------------------------------------------------------------------------

export async function lockFurnitureInRoom(client, room) {
    const { rows } = await client.query(
        'SELECT id FROM furniture WHERE room = $1 FOR UPDATE',
        [room]
    )
    return rows.map((row) => row.id)
}

export async function lockFurniture(client, id) {
    const { rows } = await client.query(
        'SELECT id FROM furniture WHERE id = $1 FOR UPDATE',
        [id]
    )
    return rows.map((row) => row.id)
}

// Alle Fächer dieser Möbel
export async function lockSlotsOfFurniture(client, furnitureIds) {
    const { rows } = await client.query(
        'SELECT id FROM shelf_slot WHERE furniture_id = ANY($1::int[]) FOR UPDATE',
        [furnitureIds]
    )
    return rows.map((row) => row.id)
}

// Gibt nur die Fächer zurück, die es wirklich gibt
export async function lockSlots(client, slotIds) {
    const { rows } = await client.query(
        'SELECT id FROM shelf_slot WHERE id = ANY($1::int[]) FOR UPDATE',
        [slotIds]
    )
    return rows.map((row) => row.id)
}

export async function countBooksInSlots(client, slotIds) {
    const { rows } = await client.query(
        'SELECT count(*)::int AS total FROM book WHERE shelf_slot_id = ANY($1::int[])',
        [slotIds]
    )
    return rows[0].total
}

// Gibt die Anzahl verschobener Bücher zurück
export async function moveBooks(client, fromSlotIds, toSlotId) {
    const { rowCount } = await client.query(
        'UPDATE book SET shelf_slot_id = $2 WHERE shelf_slot_id = ANY($1::int[])',
        [fromSlotIds, toSlotId]
    )
    return rowCount
}

export async function deleteSlots(client, slotIds) {
    await client.query('DELETE FROM shelf_slot WHERE id = ANY($1::int[])', [slotIds])
}

export async function deleteFurniture(client, furnitureIds) {
    await client.query('DELETE FROM furniture WHERE id = ANY($1::int[])', [furnitureIds])
}