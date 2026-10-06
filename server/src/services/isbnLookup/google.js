import { createRateLimiter } from '../rateLimiter.js'
import { buildData, fetchJson } from './common.js'

export const name = 'google'

const limit = createRateLimiter(500)

export async function lookup(isbn13) {
    const params = new URLSearchParams({ q: `isbn:${isbn13}`, maxResults: '1' })
    // Ohne Schlüssel teilt man sich ein knappes Kontingent (oft HTTP 429)
    if (process.env.GOOGLE_BOOKS_API_KEY) {
        params.set('key', process.env.GOOGLE_BOOKS_API_KEY)
    }

    const json = await limit(() => fetchJson(`https://www.googleapis.com/books/v1/volumes?${params}`))
    const info = json?.items?.[0]?.volumeInfo
    if (!info?.title) return null

    const image = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
    const coverUrl = image
        ? image.replace(/^http:/, 'https:').replace('&edge=curl', '')
        : null

    return {
        data: buildData({
            title: info.title,
            subtitle: info.subtitle,
            authors: info.authors,
            publisher: info.publisher,
            year: info.publishedDate,
            language: info.language,
            pages: info.pageCount,
        }),
        coverUrl,
    }
}