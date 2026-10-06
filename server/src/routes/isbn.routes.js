import { Router } from 'express'
import * as isbnController from '../controllers/isbn.controller.js'

const router = Router()

router.get('/:isbn', isbnController.lookup)   // GET /api/isbn/:isbn?refresh=true

export default router