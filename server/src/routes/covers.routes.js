import { Router } from 'express'
import * as coversController from '../controllers/covers.controller.js'
import { uploadCover } from '../middleware/upload.js'

const router = Router()

router.post('/upload', uploadCover, coversController.upload)   // POST /api/covers/upload (multipart, Feld "file")

export default router