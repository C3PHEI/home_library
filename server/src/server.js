import { pool } from './db/pool.js'

app.get('/api/health', async (req, res, next) => {
    try {
        await pool.query('SELECT 1')
        res.json({ status: 'ok' })
    } catch (err) { next(err) }
})

// immer als letzte Middleware
app.use((err, req, res, next) => {
    console.error(err)
    res.status(err.status || 500).json({
        error: { code: err.code || 'INTERNAL', message: err.message, fields: err.fields }
    })
})