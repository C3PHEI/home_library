import {NotFoundError, ValidationError} from "../errors/AppError.js";
import * as locationsRepository from "../repositories/slots.repository.js";
import {toSlotHeaderDto} from "../mappers/slots.mapper.js";

export async function getSlotHeader(bookId) {
    if (!Number.isInteger(bookId) || bookId <= 0) {
        throw new ValidationError('Ungültige Fach-ID');
    }
    const rows = await locationsRepository.findHeaderById(bookId)
    if (!rows) throw new NotFoundError(`Fach ${bookId} nicht gefunden`);
    return toSlotHeaderDto(rows)
}