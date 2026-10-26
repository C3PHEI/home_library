import { apiSend } from './client.js'

// POST /api/books
// Body: { title, author, shelfSlotId, isbn?, publisher?, publishedYear?, language?, pages?, note?, coverTempId? }
// -> 201 { book: { id, title, ..., location }, warnings: [{ code: 'DUPLICATE_ISBN' | 'COVER_NOT_SAVED', ... }] }
export function createBook(book, options) {
    return apiSend('POST', '/books', book, options)
}