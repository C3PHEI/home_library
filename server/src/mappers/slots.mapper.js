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

export function toBookListItemDto(row) {
    return {
        id: row.id,
        title: row.title,
        author: row.author,
        publishedYear: row.published_year,
        language: row.language,
        isbn13: row.isbn13,
        coverThumbUrl: row.cover_path ? `/covers/${row.id}_thumb.webp` : null,
        loanedTo: row.loaned_to,
    };
}

export function toBookDetail(row) {
    return {
        ...toBookListItemDto(row),
        isbn10: row.isbn10,
        publisher: row.publisher,
        pages: row.pages,
        note: row.note,
        coverUrl: row.cover_path ? `/covers/${row.cover_path}` : null,
        coverSource: row.cover_source,
        loanedSince: row.loaned_since,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}