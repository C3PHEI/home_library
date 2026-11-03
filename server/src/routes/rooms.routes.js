import { Router } from 'express'
import * as structureController from '../controllers/structure.controller.js'

const router = Router()

// :name ist der Raumname, im Frontend mit encodeURIComponent kodiert
router.patch('/:name', structureController.renameRoom)    // PATCH /api/rooms/:name
router.delete('/:name', structureController.deleteRoom)   // DELETE /api/rooms/:name?moveTo=12

export default router