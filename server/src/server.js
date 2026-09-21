import 'dotenv/config'
import express from 'express'
import { pool } from './db/pool.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/api/health', async (req, res, next) => {
    try {
        await pool.query('SELECT 1')
        res.json({ status: 'ok' })
    } catch (err) {
        next(err)
    }
})

// Fehler-Middleware: immer als letzte
app.use((err, req, res, next) => {
    console.error(err)
    res.status(err.status || 500).json({
        error: { code: err.code || 'INTERNAL', message: err.message, fields: err.fields }
    })
})

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`)
})