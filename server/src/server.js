import 'dotenv/config'
import { app } from './app.js'
import { ensureDirs, startTempCleanup, coversDir } from './services/coverStore.js'

const PORT = process.env.PORT || 3000

await ensureDirs()       // covers/ und covers/tmp anlegen, falls sie fehlen
startTempCleanup()      // stündlich alte temporäre Cover löschen
console.log(`Cover-Ordner: ${coversDir()}`)

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`)
})