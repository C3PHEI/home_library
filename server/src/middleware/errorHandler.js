import { AppError } from '../errors/AppError.js'

// 4 Parameter = Fehler-Middleware (Express erkennt das an der Anzahl)
export function errorHandler(err, req, res, next) {
    // Eigene Fehler: Status und Code übernehmen
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: { code: err.code, message: err.message, fields: err.fields }
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