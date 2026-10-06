// Speichert Cover als Dateien im Ordner COVERS_DIR (lokal ./covers, auf dem Pi
// ein Docker-Volume). In der Datenbank steht nur der Dateiname.
//
//   covers/tmp/<tempId>.webp         vorläufig, bis das Buch gespeichert wird
//   covers/tmp/<tempId>_thumb.webp
//   covers/<bookId>-<zufall>.webp    fest zum Buch gehörend
//   covers/<bookId>-<zufall>_thumb.webp
//
// Der Zufallsteil im Namen sorgt dafür, dass ein ersetztes Cover einen neuen
// Namen bekommt. Sonst würde der Browser das alte Bild aus seinem Cache zeigen.

import { mkdir, rename, unlink, readdir, stat, access } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { fetchWithTimeout } from './isbnLookup/common.js'

const LARGE_HEIGHT = 800
const THUMB_HEIGHT = 150
const MIN_SIZE = 50                       // kleinere Bilder sind Platzhalter, keine Cover
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024
const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000

// tempId enthält die Quelle, z. B. "openlibrary_3f9a ...". So weiss POST /api/books,
// woher das Cover stammt, ohne dass das Frontend es mitschicken muss.
const TEMP_ID_RE = /^(openlibrary|dnb|google|upload)_[0-9a-f]{32}$/
const COVER_PATH_RE = /^\d+-[0-9a-f]{8}\.webp$/

export class InvalidImageError extends Error {}

// Erst beim Aufruf lesen, damit dotenv sicher schon geladen ist
export function coversDir() {
    return path.resolve(process.env.COVERS_DIR || 'covers')
}

function tmpDir() {
    return path.join(coversDir(), 'tmp')
}

function thumbName(fileName) {
    return fileName.replace(/\.webp$/, '_thumb.webp')
}

export async function ensureDirs() {
    await mkdir(tmpDir(), { recursive: true })
}

// ---------------------------------------------------------------------------
// Temporäre Cover
// ---------------------------------------------------------------------------

export function isValidTempId(tempId) {
    return typeof tempId === 'string' && TEMP_ID_RE.test(tempId)
}

export function tempUrls(tempId) {
    return {
        previewUrl: `/covers/tmp/${tempId}.webp`,
        thumbUrl: `/covers/tmp/${tempId}_thumb.webp`,
    }
}

export async function tempExists(tempId) {
    try {
        await access(path.join(tmpDir(), `${tempId}.webp`))
        await access(path.join(tmpDir(), `${tempId}_thumb.webp`))
        return true
    } catch {
        return false
    }
}

// Bild prüfen, verkleinern und als WebP in covers/tmp ablegen. Ergebnis: tempId
export async function saveTempFromBuffer(buffer, source) {
    let meta
    try {
        meta = await sharp(buffer).metadata()
    } catch {
        throw new InvalidImageError('Datei ist kein unterstütztes Bild (JPG, PNG, WebP, GIF, AVIF)')
    }
    // Handyfotos: Breite und Höhe sind bei Hochformat in den EXIF-Daten vertauscht
    const width = meta.autoOrient?.width ?? meta.width
    const height = meta.autoOrient?.height ?? meta.height
    if (!width || !height || width < MIN_SIZE || height < MIN_SIZE) {
        throw new InvalidImageError(`Bild ist zu klein (mindestens ${MIN_SIZE} × ${MIN_SIZE} Pixel)`)
    }

    await ensureDirs()
    const tempId = `${source}_${crypto.randomBytes(16).toString('hex')}`
    await writeVariants(buffer, tmpDir(), `${tempId}.webp`)
    return tempId
}

async function writeVariants(buffer, dir, fileName) {
    // rotate() ohne Angabe dreht Handyfotos anhand der EXIF-Daten richtig herum
    const image = sharp(buffer).rotate()
    await image.clone()
        .resize({ height: LARGE_HEIGHT, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(dir, fileName))
    await image.clone()
        .resize({ height: THUMB_HEIGHT, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(path.join(dir, thumbName(fileName)))
}

// Cover einer Online-Quelle herunterladen und als temporäres Cover ablegen
export async function downloadToTemp(url, source) {
    const res = await fetchWithTimeout(url, { timeoutMs: 8000 })
    if (!res.ok) {
        await res.body?.cancel()
        throw new Error(`HTTP ${res.status}`)
    }
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) {
        await res.body?.cancel()
        throw new InvalidImageError(`kein Bild (${type || 'ohne Content-Type'})`)
    }
    const length = Number(res.headers.get('content-length') ?? 0)
    if (length > MAX_DOWNLOAD_BYTES) {
        await res.body?.cancel()
        throw new InvalidImageError('Bild zu gross')
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length > MAX_DOWNLOAD_BYTES) {
        throw new InvalidImageError('Bild zu gross')
    }
    return saveTempFromBuffer(buffer, source)
}

// ---------------------------------------------------------------------------
// Feste Cover eines Buchs
// ---------------------------------------------------------------------------

// Temporäres Cover fest einem Buch zuordnen (Dateien verschieben).
// Ergebnis: {coverPath, coverSource} für die Datenbank
export async function commitTemp(tempId, bookId) {
    const fileName = `${bookId}-${crypto.randomBytes(4).toString('hex')}.webp`
    const dir = coversDir()

    await rename(path.join(tmpDir(), `${tempId}.webp`), path.join(dir, fileName))
    await rename(path.join(tmpDir(), `${tempId}_thumb.webp`), path.join(dir, thumbName(fileName)))

    return { coverPath: fileName, coverSource: tempId.split('_')[0] }
}

// Cover-Dateien eines Buchs löschen. Fehlende Dateien sind kein Fehler.
export async function removeCoverFiles(coverPath) {
    // Nur eigene Dateinamen akzeptieren, nie Pfade wie "../.env"
    if (!COVER_PATH_RE.test(coverPath ?? '')) return
    for (const name of [coverPath, thumbName(coverPath)]) {
        try {
            await unlink(path.join(coversDir(), name))
        } catch (err) {
            if (err.code !== 'ENOENT') throw err
        }
    }
}

// ---------------------------------------------------------------------------
// Aufräumen: nicht verwendete temporäre Cover nach 24 Stunden löschen
// ---------------------------------------------------------------------------

export async function cleanupTemp(maxAgeMs = TEMP_MAX_AGE_MS) {
    let names
    try {
        names = await readdir(tmpDir())
    } catch (err) {
        if (err.code === 'ENOENT') return 0
        throw err
    }
    let removed = 0
    const limit = Date.now() - maxAgeMs
    for (const name of names) {
        const file = path.join(tmpDir(), name)
        try {
            const info = await stat(file)
            if (info.isFile() && info.mtimeMs < limit) {
                await unlink(file)
                removed++
            }
        } catch {
            // Datei wurde inzwischen verschoben oder gelöscht
        }
    }
    return removed
}

export function startTempCleanup() {
    const run = () => cleanupTemp()
        .then(n => { if (n > 0) console.log(`Cover-Aufräumen: ${n} temporäre Dateien gelöscht`) })
        .catch(err => console.warn('Cover-Aufräumen fehlgeschlagen:', err.message))
    run()
    // unref(): der Timer hält den Prozess nicht am Leben (z. B. beim Beenden)
    setInterval(run, CLEANUP_INTERVAL_MS).unref()
}