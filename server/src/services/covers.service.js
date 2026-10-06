import { ValidationError } from '../errors/AppError.js'
import * as coverStore from './coverStore.js'

// POST /api/covers/upload (multipart, Feld "file")
// Eigenes Foto als temporäres Cover ablegen. Fest gespeichert wird es erst,
// wenn das Frontend die tempId bei POST /api/books mitschickt.
export async function saveUpload(file) {
    if (!file) {
        throw new ValidationError({ file: 'Kein Bild mitgeschickt (Feld "file")' })
    }
    try {
        const tempId = await coverStore.saveTempFromBuffer(file.buffer, 'upload')
        return { tempId, ...coverStore.tempUrls(tempId), source: 'upload' }
    } catch (err) {
        if (err instanceof coverStore.InvalidImageError) {
            throw new ValidationError({ file: err.message })
        }
        throw err
    }
}