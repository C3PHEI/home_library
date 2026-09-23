import { NotFoundError, ValidationError } from "../errors/AppError.js";
import * as slotsRepository from "../repositories/slots.repository.js";
import { toSlotHeaderDto, toBookListItemDto } from "../mappers/slots.mapper.js";

const ALLOWED_SORTS = ["title", "author", "year", "created"];
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

// ---------------------------------------------------------------------------
// Helper function
// ---------------------------------------------------------------------------

function validateShelfId(shelfId) {
    if (!Number.isInteger(shelfId) || shelfId <= 0) {
        throw new ValidationError("Ungültige Fach-ID");
    }
}

function parsePositiveInt(value, defaultValue, fieldName) {
    if (value === undefined || value === "") return defaultValue;

    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        throw new ValidationError(`Ungültiger Wert für ${fieldName}`);
    }
    return number;
}

// ---------------------------------------------------------------------------
// GET /api/slots/:id
// ---------------------------------------------------------------------------

export async function getSlotHeader(shelfId) {
    validateShelfId(shelfId);

    const row = await slotsRepository.findHeaderById(shelfId);
    if (!row) throw new NotFoundError(`Fach ${shelfId} nicht gefunden`);

    return toSlotHeaderDto(row);
}

// ---------------------------------------------------------------------------
// GET /api/slots/:id/books?sort=title&page=1&limit=12
// ---------------------------------------------------------------------------

export async function getSlotBooks(shelfId, query = {}) {
    validateShelfId(shelfId);

    const sort = query.sort ?? "title";
    if (!ALLOWED_SORTS.includes(sort)) {
        throw new ValidationError("Ungültige Sortierung");
    }

    const page = parsePositiveInt(query.page, 1, "page");
    const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_LIMIT, "limit"), MAX_LIMIT);

    const offset = (page - 1) * limit;

    const [total, rows] = await Promise.all([
        slotsRepository.countBooks(shelfId),
        slotsRepository.findBooks(shelfId, sort, limit, offset),
    ]);

    if (total === 0) {
        const header = await slotsRepository.findHeaderById(shelfId);
        if (!header) throw new NotFoundError(`Fach ${shelfId} nicht gefunden`);
    }

    const totalPages = Math.ceil(total / limit);
    const from = rows.length > 0 ? offset + 1 : 0;
    const to = offset + rows.length;

    return {
        slotId: shelfId,
        sort,
        page,
        limit,
        total,
        totalPages,
        from,
        to,
        items: rows.map(toBookListItemDto),
    };
}