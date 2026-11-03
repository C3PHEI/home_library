import { Router } from 'express'
import * as structureController from '../controllers/structure.controller.js'

const router = Router()

router.patch('/:id', structureController.renameFurniture)    // PATCH /api/furniture/:id
router.delete('/:id', structureController.deleteFurniture)   // DELETE /api/furniture/:id?moveTo=12

export default router