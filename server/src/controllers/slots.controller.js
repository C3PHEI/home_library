import * as slotsService from "../services/slots.service.js";

// GET /api/slots/:id
export async function getBookSlotHeader(req, res) {
    const id = Number(req.params.id)
    const header = await slotsService.getSlotHeader(id)
    res.json(header);
}