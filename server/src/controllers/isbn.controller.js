import * as isbnService from '../services/isbn.service.js'

// GET /api/isbn/:isbn
export async function lookup(req, res) {
    const result = await isbnService.lookup(req.params.isbn, req.query)
    res.json(result)
}