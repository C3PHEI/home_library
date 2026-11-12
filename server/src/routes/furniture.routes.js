import { Router } from 'express'
import * as structureController from '../controllers/structure.controller.js'

const router = Router()

router.post('/', structureController.createFurniture)        // POST /api/furniture  Body: { room, type, name, slotCount | slotLabels }
router.post('/:id/slots', structureController.createSlot)    // POST /api/furniture/:id/slots  Body: { label }
router.patch('/:id', structureController.updateFurniture)    // PATCH /api/furniture/:id  Body: { name?, icon? }
router.delete('/:id', structureController.deleteFurniture)   // DELETE /api/furniture/:id?moveTo=12

export default router