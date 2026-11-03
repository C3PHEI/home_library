import { pool } from './pool.js'

// Führt fn in einer Transaktion aus. Alles in fn muss über den
// übergebenen client laufen, nicht über pool.query.
// Wirft fn einen Fehler, wird alles zurückgerollt.
export async function withTransaction(fn) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await fn(client)
        await client.query('COMMIT')
        return result
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}