import { Router } from 'express'
import * as slotsController from '../controllers/slots.controller.js'
import * as structureController from '../controllers/structure.controller.js'

const router = Router()

router.get('/:id', slotsController.getBookSlotHeader)          // GET /api/slots/:id
router.get('/:id/books', slotsController.getBookSlotDetails)   // GET /api/slots/:id/books?sort=title&page=1&limit=12
router.patch('/:id', structureController.renameSlot)           // PATCH /api/slots/:id
router.delete('/:id', structureController.deleteSlot)          // DELETE /api/slots/:id?moveTo=12

export default router