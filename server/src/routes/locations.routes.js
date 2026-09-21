import { Router } from 'express'
import * as locationsController from '../controllers/locations.controller.js'

const router = Router()

router.get('/', locationsController.getAll)   // GET /api/locations

export default router