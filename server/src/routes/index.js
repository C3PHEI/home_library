import { Router } from 'express'
import healthRoutes from './health.routes.js'
import locationsRoutes from './locations.routes.js'
import slotsRoutes from './slots.routes.js'
import booksRoutes from './books.routes.js'
import isbnRoutes from './isbn.routes.js'
import coversRoutes from './covers.routes.js'
import searchRoutes from './search.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/locations', locationsRoutes)
router.use('/slots', slotsRoutes)
router.use('/books', booksRoutes)
router.use('/isbn', isbnRoutes)
router.use('/covers', coversRoutes)
router.use('/search', searchRoutes)

export default router