import { Router } from 'express'
import { pool } from '../db/pool.js'

const router = Router()

router.get('/', async (req, res) => {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
})

export default router