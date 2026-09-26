import * as booksService from '../services/books.service.js'

// GET /api/books?sort=title&dir=asc&page=1&limit=25&author=&language=&year=
export async function getAll(req, res) {
    const result = await booksService.getBooks(req.query)
    res.json(result)
}