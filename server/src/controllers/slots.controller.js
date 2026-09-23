import * as slotsService from "../services/slots.service.js";
import {getSlotBooks} from "../services/slots.service.js";

// GET /api/slots/:id
export async function getBookSlotHeader(req, res) {
    const id = Number(req.params.id)
    const result = await slotsService.getSlotHeader(id)
    res.json(result);
}

// GET /api/slots/:id/books?sort=title&page=1&limit=12
export async function getBookSlotDetails(req, res) {
    const id = Number(req.params.id)
    const result = await slotsService.getSlotBooks(id, req.query);
    res.json(result);
}