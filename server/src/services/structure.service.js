import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError.js'
import { withTransaction } from '../db/transaction.js'
import * as structureRepository from '../repositories/structure.repository.js'
import { FURNITURE_ICONS, ROOM_ICONS } from '../validation/icons.js'

const NAME_MAX_LENGTH = 60

const MAX_SLOTS = 40 // Fächer pro Möbelstück, wie im Dialog "Möbelstück hinzufügen"

// Muss zum CHECK auf furniture.type und zu client/src/utils/furniture.js passen
const FURNITURE_TYPES = new Set(['shelf', 'cabinet', 'table', 'nightstand', 'other'])

// So heissen Möbel ohne Raum in der Übersicht (location.mapper.js)
const NO_ROOM_LABEL = 'Ohne Raum'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// Leerzeichen am Rand weg, mehrere Leerzeichen zu einem
function cleanName(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new ValidationError({ [field]: 'Bitte einen Namen eingeben' })
    }
    const name = value.trim().replace(/\s+/g, ' ')
    if (name.length > NAME_MAX_LENGTH) {
        throw new ValidationError({ [field]: `Höchstens ${NAME_MAX_LENGTH} Zeichen` })
    }
    return name
}

function parseId(value, field = 'id') {
    const id = Number(value)
    if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError({ [field]: 'Muss eine positive Ganzzahl sein' })
    }
    return id
}

// ?moveTo=12 -> 12, fehlt -> null
function parseMoveTo(query = {}) {
    if (query.moveTo === undefined || query.moveTo === '') return null
    return parseId(query.moveTo, 'moveTo')
}

// 'sofa' -> 'sofa', null oder '' -> null (zurück zum Standard-Icon)
// allowed: FURNITURE_ICONS oder ROOM_ICONS
function parseIcon(value, allowed) {
    if (value === null || value === '') return null
    if (typeof value !== 'string' || !allowed.has(value)) {
        throw new ValidationError({ icon: 'Unbekanntes Symbol' })
    }
    return value
}

// 23505 = unique_violation (Name schon vergeben)
function isUniqueViolation(err) {
    return err.code === '23505'
}

// Fächer für ein neues Möbelstück:
//   slotLabels: ["Oben", "Mitte"]  -> diese Namen
//   slotCount: 3                   -> "Fach 1" bis "Fach 3"
//   slotCount: 1                   -> "Ablage" (wie bei Tischen, siehe utils/location.js)
function parseSlotLabels(body) {
    if (body.slotLabels !== undefined) {
        const list = body.slotLabels
        if (!Array.isArray(list) || list.length === 0) {
            throw new ValidationError({ slotLabels: 'Mindestens ein Fach angeben' })
        }
        if (list.length > MAX_SLOTS) {
            throw new ValidationError({ slotLabels: `Höchstens ${MAX_SLOTS} Fächer` })
        }
        const labels = list.map((label) => cleanName(label, 'slotLabels'))
        const seen = new Set()
        for (const label of labels) {
            const key = label.toLowerCase()
            if (seen.has(key)) {
                throw new ValidationError({ slotLabels: `«${label}» kommt mehrmals vor` })
            }
            seen.add(key)
        }
        return labels
    }

    const count = body.slotCount
    if (!Number.isInteger(count) || count < 1 || count > MAX_SLOTS) {
        throw new ValidationError({ slotCount: `Eine Zahl von 1 bis ${MAX_SLOTS} eingeben` })
    }
    if (count === 1) return ['Ablage']
    return Array.from({ length: count }, (_, index) => `Fach ${index + 1}`)
}

// ---------------------------------------------------------------------------
// Anlegen
// ---------------------------------------------------------------------------

// POST /api/furniture
// Body: { "room": "Flur", "type": "cabinet", "name": "Schrank im Flur", "slotCount": 4 }
//   oder statt slotCount: "slotLabels": ["Oben", "Mitte", "Unten"]
//   optional "icon": "door-open"
// Gibt es den Raum noch nicht, entsteht er mit dem Möbelstück
// (ein Raum ist nur die Spalte furniture.room).
export async function createFurniture(body = {}) {
    const roomInput = cleanName(body.room, 'room')
    if (roomInput.toLowerCase() === NO_ROOM_LABEL.toLowerCase()) {
        throw new ValidationError({ room: 'Bitte einen anderen Namen wählen' })
    }
    if (!FURNITURE_TYPES.has(body.type)) {
        throw new ValidationError({ type: 'Bitte eine Art wählen' })
    }
    const name = cleanName(body.name, 'name')
    const icon = body.icon === undefined ? null : parseIcon(body.icon, FURNITURE_ICONS)
    const labels = parseSlotLabels(body)

    try {
        return await withTransaction(async (client) => {
            // "wohnzimmer" landet im bestehenden Raum "Wohnzimmer"
            const room = (await structureRepository.findRoomName(client, roomInput)) ?? roomInput
            const furniture = await structureRepository.insertFurniture(client, {
                name, type: body.type, room, icon,
            })
            const slots = await structureRepository.insertSlots(client, furniture.id, labels)
            return { ...furniture, slots }
        })
    } catch (err) {
        if (isUniqueViolation(err)) {
            throw new ConflictError('Diesen Namen gibt es schon', { name: 'Ein anderes Möbelstück heisst schon so' })
        }
        throw err
    }
}

// POST /api/furniture/:id/slots   Body: { "label": "Ganz unten" }
// Das neue Fach kommt ans Ende des Möbelstücks.
export async function createSlot(furnitureIdParam, body = {}) {
    const furnitureId = parseId(furnitureIdParam)
    const label = cleanName(body.label, 'label')
    const duplicate = () =>
        new ConflictError('Diesen Namen gibt es schon', { label: 'Ein anderes Fach in diesem Möbel heisst schon so' })

    try {
        return await withTransaction(async (client) => {
            // Sperre: zwei gleichzeitige Anfragen legen nicht dasselbe Fach an
            const found = await structureRepository.lockFurniture(client, furnitureId)
            if (found.length === 0) throw new NotFoundError(`Möbelstück ${furnitureId} nicht gefunden`)

            const existing = await structureRepository.findSlotLabels(client, furnitureId)
            if (existing.length >= MAX_SLOTS) {
                throw new ValidationError({ label: `Ein Möbelstück hat höchstens ${MAX_SLOTS} Fächer` })
            }
            if (existing.some((other) => other.toLowerCase() === label.toLowerCase())) throw duplicate()

            return structureRepository.insertSlot(client, furnitureId, label)
        })
    } catch (err) {
        if (isUniqueViolation(err)) throw duplicate()
        throw err
    }
}

// ---------------------------------------------------------------------------
// Umbenennen
// ---------------------------------------------------------------------------

// PATCH /api/rooms/:name   Body: { "name": "Stube", "icon": "sofa" }
// Beide Felder sind optional, aber eines muss da sein. icon: null = Standard-Icon
export async function updateRoom(oldName, body = {}) {
    const name = body.name === undefined ? oldName : cleanName(body.name, 'name')
    const icon = body.icon === undefined ? undefined : parseIcon(body.icon, ROOM_ICONS)
    if (body.name === undefined && icon === undefined) {
        throw new ValidationError({ name: 'Name oder Symbol angeben' })
    }

    return withTransaction(async (client) => {
        const furnitureCount = await structureRepository.lockRoom(client, oldName)
        if (furnitureCount === 0) throw new NotFoundError(`Raum «${oldName}» nicht gefunden`)

        if (name !== oldName) {
            if (await structureRepository.otherRoomExists(client, name, oldName)) {
                throw new ConflictError('Diesen Raum gibt es schon', { name: 'Diesen Raum gibt es schon' })
            }
            await structureRepository.renameRoom(client, oldName, name)
        }

        if (icon !== undefined) {
            await structureRepository.setRoomIcon(client, name, icon)
        }

        return { room: name, icon: await structureRepository.findRoomIcon(client, name) }
    })
}

// PATCH /api/furniture/:id   Body: { "name": "Regal B", "icon": "sofa" }
// Beide Felder sind optional, aber eines muss da sein. icon: null = Standard-Icon
export async function updateFurniture(idParam, body = {}) {
    const id = parseId(idParam)

    const changes = {}
    if (body.name !== undefined) changes.name = cleanName(body.name, 'name')
    if (body.icon !== undefined) changes.icon = parseIcon(body.icon, FURNITURE_ICONS)
    if (Object.keys(changes).length === 0) {
        throw new ValidationError({ name: 'Name oder Symbol angeben' })
    }

    try {
        const row = await structureRepository.updateFurniture(id, changes)
        if (!row) throw new NotFoundError(`Möbelstück ${id} nicht gefunden`)
        return row
    } catch (err) {
        if (isUniqueViolation(err)) {
            throw new ConflictError('Diesen Namen gibt es schon', { name: 'Ein anderes Möbelstück heisst schon so' })
        }
        throw err
    }
}

// PATCH /api/slots/:id   Body: { "label": "Oben" }
export async function renameSlot(idParam, body = {}) {
    const id = parseId(idParam)
    const label = cleanName(body.label, 'label')

    try {
        const row = await structureRepository.renameSlot(id, label)
        if (!row) throw new NotFoundError(`Fach ${id} nicht gefunden`)
        return row
    } catch (err) {
        if (isUniqueViolation(err)) {
            throw new ConflictError('Diesen Namen gibt es schon', { label: 'Ein anderes Fach in diesem Möbel heisst schon so' })
        }
        throw err
    }
}

// ---------------------------------------------------------------------------
// Löschen
// Bücher werden nie gelöscht. Stehen noch welche in den betroffenen
// Fächern, muss ?moveTo=<Fach-ID> angegeben werden, sonst 409 HAS_BOOKS.
// ---------------------------------------------------------------------------

// DELETE /api/rooms/:name?moveTo=12
export async function deleteRoom(room, query) {
    const moveTo = parseMoveTo(query)

    return withTransaction(async (client) => {
        const furnitureIds = await structureRepository.lockFurnitureInRoom(client, room)
        if (furnitureIds.length === 0) throw new NotFoundError(`Raum «${room}» nicht gefunden`)

        const slotIds = await structureRepository.lockSlotsOfFurniture(client, furnitureIds)
        const result = await removeAndMoveBooks(client, { furnitureIds, slotIds }, moveTo)
        await structureRepository.deleteRoomIcon(client, room)
        return result
    })
}

// DELETE /api/furniture/:id?moveTo=12
export async function deleteFurniture(idParam, query) {
    const id = parseId(idParam)
    const moveTo = parseMoveTo(query)

    return withTransaction(async (client) => {
        const furnitureIds = await structureRepository.lockFurniture(client, id)
        if (furnitureIds.length === 0) throw new NotFoundError(`Möbelstück ${id} nicht gefunden`)

        const slotIds = await structureRepository.lockSlotsOfFurniture(client, furnitureIds)
        return removeAndMoveBooks(client, { furnitureIds, slotIds }, moveTo)
    })
}

// DELETE /api/slots/:id?moveTo=12
export async function deleteSlot(idParam, query) {
    const id = parseId(idParam)
    const moveTo = parseMoveTo(query)

    return withTransaction(async (client) => {
        const slotIds = await structureRepository.lockSlots(client, [id])
        if (slotIds.length === 0) throw new NotFoundError(`Fach ${id} nicht gefunden`)

        return removeAndMoveBooks(client, { furnitureIds: [], slotIds }, moveTo)
    })
}

// Bücher umziehen (falls nötig), dann Fächer und Möbel löschen
async function removeAndMoveBooks(client, { furnitureIds, slotIds }, moveTo) {
    const bookCount = await structureRepository.countBooksInSlots(client, slotIds)
    let movedBooks = 0

    if (bookCount > 0) {
        if (moveTo === null) {
            const books = bookCount === 1 ? '1 Buch' : `${bookCount} Bücher`
            throw new ConflictError(
                `Hier stehen noch ${books}. Bitte ein Fach wählen, in das sie umziehen.`,
                { moveTo: 'Bitte ein Fach wählen' },
                'HAS_BOOKS'
            )
        }
        if (slotIds.includes(moveTo)) {
            throw new ValidationError({ moveTo: 'Dieses Fach wird ebenfalls gelöscht' })
        }
        const target = await structureRepository.lockSlots(client, [moveTo])
        if (target.length === 0) {
            throw new ValidationError({ moveTo: 'Fach nicht gefunden' })
        }
        movedBooks = await structureRepository.moveBooks(client, slotIds, moveTo)
    }

    await structureRepository.deleteSlots(client, slotIds)
    await structureRepository.deleteFurniture(client, furnitureIds)

    return {
        deletedFurniture: furnitureIds.length,
        deletedSlots: slotIds.length,
        movedBooks,
        movedTo: movedBooks > 0 ? moveTo : null,
    }
}