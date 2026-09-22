import { Router } from 'express'
import * as slotsController from '../controllers/slots.controller.js'

const router = Router()

router.get('/:id', slotsController.getBookSlotHeader)   // GET /api/slots/:id
export default router