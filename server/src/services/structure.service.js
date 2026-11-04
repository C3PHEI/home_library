import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError.js'
import { withTransaction } from '../db/transaction.js'
import * as structureRepository from '../repositories/structure.repository.js'
import { FURNITURE_ICONS, ROOM_ICONS } from '../validation/icons.js'

const NAME_MAX_LENGTH = 60

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