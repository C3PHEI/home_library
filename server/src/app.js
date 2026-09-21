import express from 'express'
import apiRouter from './routes/index.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

export const app = express()

// Pipeline: Reihenfolge ist wichtig (wie app.Use... in Program.cs)
app.use(express.json())     // JSON-Body lesen
app.use('/api', apiRouter)  // alle Endpoints
app.use(notFound)           // unbekannte Route -> 404
app.use(errorHandler)       // Fehler -> einheitliches JSON, immer zuletzt