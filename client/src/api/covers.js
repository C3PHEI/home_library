import { apiUpload } from './client.js'

// POST /api/covers/upload (multipart, Feld "file")
// -> 201 { tempId, previewUrl, thumbUrl, source: 'upload' }
// Fest gespeichert wird das Bild erst, wenn die tempId bei POST /api/books mitkommt.
export function uploadCover(file, options) {
    const formData = new FormData()
    formData.append('file', file)
    return apiUpload('/covers/upload', formData, options)
}