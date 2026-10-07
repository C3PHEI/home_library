import * as searchService from '../services/search.service.js'

// GET /api/search?q=suesskin&limit=20
export async function search(req, res) {
    const result = await searchService.search(req.query)
    res.json(result)
}