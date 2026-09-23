import { Router } from 'express'
import * as slotsController from '../controllers/slots.controller.js'
import {getSlotBooks} from "../services/slots.service.js";
import {getBookSlotDetails} from "../controllers/slots.controller.js";

const router = Router()

router.get('/:id', slotsController.getBookSlotHeader)   // GET /api/slots/:id

router.get('/:id/books', slotsController.getBookSlotDetails)   // GET /api/slots/:id/books?sort=title&page=1&limit=12
export default router