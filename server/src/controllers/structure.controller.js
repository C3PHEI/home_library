import * as structureService from '../services/structure.service.js'

// POST /api/furniture   Body: { "room": "Flur", "type": "cabinet", "name": "Schrank im Flur", "slotCount": 4 }
// statt slotCount auch "slotLabels": ["Oben", "Mitte", "Unten"]
export async function createFurniture(req, res) {
    res.status(201).json(await structureService.createFurniture(req.body))
}

// POST /api/furniture/:id/slots   Body: { "label": "Ganz unten" }
export async function createSlot(req, res) {
    res.status(201).json(await structureService.createSlot(req.params.id, req.body))
}

// PATCH /api/rooms/:name   Body: { "name": "...", "icon": "sofa" }
export async function updateRoom(req, res) {
    res.json(await structureService.updateRoom(req.params.name, req.body))
}

// DELETE /api/rooms/:name?moveTo=12
export async function deleteRoom(req, res) {
    res.json(await structureService.deleteRoom(req.params.name, req.query))
}

// PATCH /api/furniture/:id   Body: { "name": "...", "icon": "sofa" }
export async function updateFurniture(req, res) {
    res.json(await structureService.updateFurniture(req.params.id, req.body))
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