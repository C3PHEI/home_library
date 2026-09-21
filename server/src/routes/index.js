import { Router } from 'express'
import healthRoutes from './health.routes.js'
import locationsRoutes from './locations.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/locations', locationsRoutes)

export default router