import * as structureService from '../services/structure.service.js'

// PATCH /api/rooms/:name   Body: { "name": "..." }
export async function renameRoom(req, res) {
    res.json(await structureService.renameRoom(req.params.name, req.body))
}

// DELETE /api/rooms/:name?moveTo=12
export async function deleteRoom(req, res) {
    res.json(await structureService.deleteRoom(req.params.name, req.query))
}

// PATCH /api/furniture/:id   Body: { "name": "..." }
export async function renameFurniture(req, res) {
    res.json(await structureService.renameFurniture(req.params.id, req.body))
}

// DELETE /api/furniture/:id?moveTo=12
export async function deleteFurniture(req, res) {
    res.json(await structureService.deleteFurniture(req.params.id, req.query))
}

// PATCH /api/slots/:id   Body: { "label": "..." }
export async function renameSlot(req, res) {
    res.json(await structureService.renameSlot(req.params.id, req.body))
}

// DELETE /api/slots/:id?moveTo=12
export async function deleteSlot(req, res) {
    res.json(await structureService.deleteSlot(req.params.id, req.query))
}