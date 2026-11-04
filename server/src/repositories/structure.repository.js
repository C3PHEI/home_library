import { pool } from '../db/pool.js'

// Räume, Möbel und Fächer umbenennen und löschen.
// Ein Raum ist keine eigene Tabelle, sondern die Spalte furniture.room.
// Das Raum-Icon steht in room_icon (eine Zeile pro Raum mit eigenem Icon).

// ---------------------------------------------------------------------------
// Umbenennen
// ---------------------------------------------------------------------------

// Raum-Funktionen laufen in einer Transaktion (client), weil Name und
// Icon in zwei Tabellen stehen.

// Sperrt die Möbel des Raums, gibt ihre Anzahl zurück (0 = Raum gibt es nicht)
export async function lockRoom(client, room) {
    const { rowCount } = await client.query(
        'SELECT id FROM furniture WHERE room = $1 FOR UPDATE',
        [room]
    )
    return rowCount
}

// Gibt es schon einen anderen Raum mit diesem Namen (Gross/klein egal)?
export async function otherRoomExists(client, name, exceptRoom) {
    const { rows } = await client.query(
        `SELECT 1 FROM furniture
          WHERE lower(room) = lower($1) AND room <> $2
          LIMIT 1`,
        [name, exceptRoom]
    )
    return rows.length > 0
}

// Name in furniture und room_icon ändern
export async function renameRoom(client, oldName, newName) {
    await client.query('UPDATE furniture SET room = $2 WHERE room = $1', [oldName, newName])
    // Alte, verwaiste Zeile mit dem neuen Namen entfernen, sonst Konflikt beim Primärschlüssel
    await client.query('DELETE FROM room_icon WHERE room = $1', [newName])
    await client.query('UPDATE room_icon SET room = $2 WHERE room = $1', [oldName, newName])
}

// icon null = zurück zum Standard (Zeile löschen)
export async function setRoomIcon(client, room, icon) {
    if (icon === null) {
        await client.query('DELETE FROM room_icon WHERE room = $1', [room])
        return
    }
    await client.query(
        `INSERT INTO room_icon (room, icon) VALUES ($1, $2)
         ON CONFLICT (room) DO UPDATE SET icon = EXCLUDED.icon`,
        [room, icon]
    )
}

export async function findRoomIcon(client, room) {
    const { rows } = await client.query('SELECT icon FROM room_icon WHERE room = $1', [room])
    return rows[0]?.icon ?? null
}

export async function deleteRoomIcon(client, room) {
    await client.query('DELETE FROM room_icon WHERE room = $1', [room])
}

// changes: { name?, icon? } - nur gesetzte Felder werden geändert
export async function updateFurniture(id, changes) {
    const sets = []
    const params = [id]

    if (changes.name !== undefined) {
        params.push(changes.name)
        sets.push(`name = $${params.length}`)
    }
    if (changes.icon !== undefined) {
        params.push(changes.icon)
        sets.push(`icon = $${params.length}`)
    }

    const { rows } = await pool.query(
        `UPDATE furniture SET ${sets.join(', ')} WHERE id = $1 RETURNING id, name, icon`,
        params
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