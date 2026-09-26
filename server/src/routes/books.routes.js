import { Router } from 'express'
import * as booksController from '../controllers/books.controller.js'

const router = Router()

router.get('/', booksController.getAll)   // GET /api/books?sort=title&dir=asc&page=1&limit=25&author=&language=&year=
router.get('/filters', booksController.getFilters)   // GET /api/books/filters

export default router