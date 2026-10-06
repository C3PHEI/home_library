import * as booksService from '../services/books.service.js'

// GET /api/books?sort=title&dir=asc&page=1&limit=25&author=&language=&year=
export async function getAll(req, res) {
    const result = await booksService.getBooks(req.query)
    res.json(result)
}

// GET /api/books/filters
export async function getFilters(req, res) {
    const result = await booksService.getFilterOptions()
    res.json(result)
}

// GET /api/books/:id
export async function getById(req, res) {
    const result = await booksService.getBookById(req.params.id)
    res.json(result)
}

// POST /api/books
export async function create(req, res) {
    const result = await booksService.createBook(req.body)
    res.status(201).location(`/api/books/${result.book.id}`).json(result)
}

// PATCH /api/books/:id/location
export async function move(req, res) {
    const result = await booksService.moveBook(req.params.id, req.body)
    res.json(result)
}

// PATCH /api/books/:id
export async function update(req, res) {
    const result = await booksService.updateBook(req.params.id, req.body)
    res.json(result)
}

// DELETE /api/books/:id
export async function remove(req, res) {
    await booksService.deleteBook(req.params.id)
    res.status(204).end()
}

// PUT /api/books/:id/cover   Body: { "coverTempId": "..." }
export async function setCover(req, res) {
    const result = await booksService.setBookCover(req.params.id, req.body)
    res.json(result)
}

// DELETE /api/books/:id/cover
export async function removeCover(req, res) {
    const result = await booksService.deleteBookCover(req.params.id)
    res.json(result)
}

// GET /api/books/export.csv
export async function exportCsv(req, res) {
    const csv = await booksService.exportBooksCsv()
    const date = new Date().toISOString().slice(0, 10)
    res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bibliothek-${date}.csv"`,
    })
    res.send(csv)
}