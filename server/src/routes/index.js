import { Router } from 'express'
import healthRoutes from './health.routes.js'
import locationsRoutes from './locations.routes.js'
import slotsRoutes from './slots.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/locations', locationsRoutes)
router.use('/slots', slotsRoutes)

export default router