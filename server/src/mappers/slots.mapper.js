export function toSlotHeaderDto(row) {
    return {
        id: row.id,
        label: row.label,
        furniture: {
            id: row.furniture_id,
            name: row.furniture_name,
        },
        room: row.room,
        bookCount: Number(row.book_count ?? 0),
    };
}