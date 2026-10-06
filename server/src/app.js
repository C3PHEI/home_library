import express from 'express'
import apiRouter from './routes/index.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import { coversDir } from './services/coverStore.js'

export const app = express()

// Pipeline: Reihenfolge ist wichtig (wie app.Use... in Program.cs)
app.use(express.json())     // JSON-Body lesen
app.use('/api', apiRouter)  // alle Endpoints
// Cover-Bilder. Auf dem Pi liefert sie Nginx direkt aus, lokal macht es Express.
// Die Dateinamen ändern sich nie, darum darf der Browser sie lange cachen.
app.use('/covers', express.static(coversDir(), { maxAge: '30d', index: false }))
app.use(notFound)           // unbekannte Route -> 404
app.use(errorHandler)       // Fehler -> einheitliches JSON, immer zuletzt