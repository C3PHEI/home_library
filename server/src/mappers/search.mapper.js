import { toBookListItemWithLocationDto } from './books.mapper.js'

// Spalte in der Abfrage -> Tab-Schlüssel im JSON
const MATCH_COLUMNS = {
    m_title: 'title',
    m_author: 'author',
    m_publisher: 'publisher',
    m_year: 'year',
    m_language: 'language',
    m_location: 'location',
    m_isbn: 'isbn',
}

// Treffer: Listeneintrag + Standort + in welchen Tabs das Buch vorkommt
export function toSearchHitDto(row) {
    const matches = Object.entries(MATCH_COLUMNS)
        .filter(([column]) => row[column] === true)
        .map(([, tab]) => tab)

    return {
        ...toBookListItemWithLocationDto(row),
        matches,
    }
}