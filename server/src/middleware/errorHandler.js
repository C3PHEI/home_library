import { AppError } from '../errors/AppError.js'

// 4 Parameter = Fehler-Middleware (Express erkennt das an der Anzahl)
export function errorHandler(err, req, res, next) {
    // Eigene Fehler: Status und Code übernehmen
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: { code: err.code, message: err.message, fields: err.fields }
        })
    }

    // Upload-Fehler von multer (Bild zu gross, falscher Feldname ...)
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: { code: 'FILE_TOO_LARGE', message: 'Bild ist grösser als 10 MB', fields: { file: 'Maximal 10 MB' } }
            })
        }
        return res.status(400).json({
            error: { code: 'VALIDATION', message: 'Upload ungültig', fields: { file: 'Genau ein Bild im Feld "file" schicken' } }
        })
    }

    // Kaputtes JSON im Request-Body
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: { code: 'INVALID_JSON', message: 'Body ist kein gültiges JSON' }
        })
    }

    // Alles andere: loggen, aber keine Details an den Client
    console.error(err)
    res.status(500).json({
        error: { code: 'INTERNAL', message: 'Interner Serverfehler' }
    })
}