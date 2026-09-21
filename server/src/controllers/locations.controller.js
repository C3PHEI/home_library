import * as locationsService from '../services/locations.service.js'

// GET /api/locations
export async function getAll(req, res) {
    const tree = await locationsService.getTree()
    res.json(tree)
}