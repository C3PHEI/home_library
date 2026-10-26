import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getLocations } from '../api/locations.js'
import { lookupIsbn } from '../api/isbn.js'
import { uploadCover } from '../api/covers.js'
import { createBook } from '../api/books.js'
import { useApi } from '../hooks/useApi.js'
import { checkIsbn, cleanIsbn, isbnProblem } from '../utils/isbn.js'
import { placeLabel, slotOptionGroups } from '../utils/location.js'
import { joinGerman } from '../utils/format.js'
import Notice from '../components/Notice.jsx'
import BookFormFields from '../components/books/BookFormFields.jsx'
import IsbnLookupForm from '../components/add/IsbnLookupForm.jsx'
import LookupNotices from '../components/add/LookupNotices.jsx'
import CoverPicker from '../components/add/CoverPicker.jsx'
import LookupSources from '../components/add/LookupSources.jsx'
import './AddBookIsbnPage.css'

const EMPTY_BOOK = {
    title: '',
    author: '',
    publisher: '',
    publishedYear: '',
    language: '',
    pages: '',
    shelfSlotId: '',
    note: '',
}
const EMPTY_COVER = { choice: 'none', upload: null, uploading: false, error: null }
const IDLE = { status: 'idle' }
const MAX_COVER_BYTES = 10 * 1024 * 1024

// Felder, die der ISBN-Abruf ausfüllt (Standort und Notiz bleiben, wie sie sind)
const LOOKUP_FIELDS = ['title', 'author', 'publisher', 'publishedYear', 'language', 'pages']
// Reihenfolge auf der Seite: dorthin springt der Fokus beim ersten Fehler
const FIELD_IDS = {
    isbn: 'isbn',
    title: 'book-title',
    author: 'book-author',
    publisher: 'book-publisher',
    publishedYear: 'book-year',
    language: 'book-language',
    pages: 'book-pages',
    shelfSlotId: 'book-location',
    note: 'book-note',
}

// Erfassen über ISBN: /erfassen (aus einer leeren Reihe: /erfassen?slot=17)
// Ablauf: ISBN eintippen -> "Daten holen" füllt das Formular -> prüfen,
// Standort wählen, Cover wählen -> speichern. Danach ist alles leer für das nächste Buch.
export default function AddBookIsbnPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const slotParam = searchParams.get('slot')

    const locations = useApi(getLocations)
    const slotGroups = useMemo(
        () => (locations.data ? slotOptionGroups(locations.data.rooms) : []),
        [locations.data],
    )

    const [isbn, setIsbn] = useState('')
    // lookup: { status: 'idle' | 'loading' | 'done' | 'error', query, result, filled, error }
    const [lookup, setLookup] = useState(IDLE)
    const [book, setBook] = useState(() => ({ ...EMPTY_BOOK, shelfSlotId: slotParam ?? '' }))
    const [cover, setCover] = useState(EMPTY_COVER)
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [saved, setSaved] = useState(null)

    const isbnInputRef = useRef(null)
    const lookupController = useRef(null)

    // Seite verlassen: laufenden Abruf abbrechen
    useEffect(() => () => lookupController.current?.abort(), [])

    // Standort aus ?slot=, den es nicht (mehr) gibt, gilt als nicht gewählt
    const slotValue = slotGroups.some((group) => group.options.some((option) => String(option.id) === book.shelfSlotId))
        ? book.shelfSlotId
        : ''

    const onlineCover = lookup.status === 'done' ? lookup.result.cover : null

    // Speichern erst, wenn die Pflichtfelder stehen (wie in Erfassen-Manuell.html)
    const missing = [!book.title.trim() && 'Titel', !book.author.trim() && 'Autor', !slotValue && 'Standort'].filter(Boolean)
    let blockedReason = null
    if (lookup.status === 'loading') blockedReason = 'Warte auf den Abruf …'
    else if (cover.uploading) blockedReason = 'Warte auf das Bild …'
    else if (missing.length > 0) blockedReason = `Noch nötig: ${joinGerman(missing)}`
    const canSave = !blockedReason && !saving

    // ---------- ISBN ----------

    function handleIsbnChange(value) {
        setIsbn(value)
        if (errors.isbn) setErrors((prev) => omit(prev, ['isbn']))

        // Gehört das Ergebnis zu einer anderen ISBN, wird es verworfen: Hinweise und
        // Online-Cover verschwinden, ebenso die geholten Angaben. Was von Hand geändert
        // wurde, bleibt stehen. So landet kein Titel des vorherigen Buchs beim neuen.
        if (lookup.status !== 'idle' && cleanIsbn(value) !== lookup.query) {
            lookupController.current?.abort()
            if (lookup.filled) setBook((prev) => clearUnchanged(prev, lookup.filled))
            setLookup(IDLE)
            setCover((prev) => (prev.choice === 'online' ? { ...prev, choice: prev.upload ? 'upload' : 'none' } : prev))
        }
    }

    async function runLookup({ refresh = false } = {}) {
        const check = checkIsbn(isbn)
        const problem = isbnProblem(check)
        if (problem) {
            setErrors((prev) => ({ ...prev, isbn: problem }))
            isbnInputRef.current?.focus()
            return
        }

        lookupController.current?.abort()
        const controller = new AbortController()
        lookupController.current = controller

        setSaved(null)
        setErrors((prev) => omit(prev, ['isbn']))
        setLookup({ status: 'loading', query: check.isbn })

        try {
            const result = await lookupIsbn(check.isbn, { refresh }, { signal: controller.signal })
            // filled: was der Abruf eingetragen hat (zum Wegräumen, falls die ISBN wechselt)
            const filled = result.found ? fieldsFromLookup(result.data) : null
            setLookup({ status: 'done', query: check.isbn, result, filled })

            if (filled) {
                setBook((prev) => ({ ...prev, ...filled }))
                setErrors((prev) => omit(prev, LOOKUP_FIELDS))
            }
            // Ein eigenes Foto bleibt gewählt, sonst das Online-Cover, falls es eines gibt
            setCover((prev) => ({
                ...prev,
                error: null,
                choice: prev.choice === 'upload' ? 'upload' : result.cover ? 'online' : 'none',
            }))
        } catch (error) {
            if (error.name === 'AbortError') return
            if (error.status === 400) {
                // Backend lehnt die ISBN ab (sollte dank der Prüfung oben selten sein)
                setLookup(IDLE)
                setErrors((prev) => ({ ...prev, isbn: error.fields?.isbn ?? error.message }))
                return
            }
            setLookup({ status: 'error', query: check.isbn, error })
        }
    }

    // ---------- Felder und Cover ----------

    function handleFieldChange(name, value) {
        setBook((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors((prev) => omit(prev, [name]))
    }

    async function handleUpload(file) {
        if (file.size > MAX_COVER_BYTES) {
            setCover((prev) => ({ ...prev, error: 'Das Bild ist grösser als 10 MB. Bitte ein kleineres wählen.' }))
            return
        }

        setCover((prev) => ({ ...prev, uploading: true, error: null }))
        try {
            const upload = await uploadCover(file)
            setCover((prev) => ({ ...prev, uploading: false, upload, choice: 'upload' }))
        } catch (error) {
            setCover((prev) => ({ ...prev, uploading: false, error: uploadErrorMessage(error) }))
        }
    }

    // ---------- Speichern ----------

    async function handleSubmit(event) {
        event.preventDefault()
        if (!canSave) return

        const { payload, errors: inputErrors } = buildPayload({ isbn, book, slotValue, cover, onlineCover })
        if (inputErrors) {
            setErrors(inputErrors)
            focusFirstError(inputErrors)
            return
        }

        setSaving(true)
        setSaveError(null)
        setSaved(null)
        try {
            const result = await createBook(payload)
            setSaved(result)
            resetForm()
            locations.reload() // Anzahl Bücher und "(leer)" im Dropdown aktualisieren
        } catch (error) {
            handleSaveError(error)
        } finally {
            setSaving(false)
        }
    }

    function handleSaveError(error) {
        const fields = error.status === 400 ? error.fields ?? {} : {}
        const { coverTempId, ...fieldErrors } = fields

        if (coverTempId) {
            // z. B. vorläufiges Cover nach 24 Stunden aufgeräumt
            setCover((prev) => ({ ...prev, error: coverTempId }))
        }
        setErrors(fieldErrors)
        focusFirstError(fieldErrors)

        // Fehler ohne passendes Feld (Server weg, 500, ...) oben am Knopf zeigen
        const shown = Object.keys(fieldErrors).some((key) => key in FIELD_IDS) || coverTempId
        if (!shown) setSaveError(error)
    }

    // Nach dem Speichern: alles leer, auch der Standort (Anforderungsliste, "Entschieden")
    function resetForm() {
        lookupController.current?.abort()
        setIsbn('')
        setLookup(IDLE)
        setBook(EMPTY_BOOK)
        setCover(EMPTY_COVER)
        setErrors({})
        if (slotParam) setSearchParams({}, { replace: true })

        window.scrollTo({ top: 0, behavior: 'smooth' })
        isbnInputRef.current?.focus({ preventScroll: true })
    }

    function handleCancel() {
        if (slotParam) navigate(`/regal/${slotParam}`)
        else if (window.history.state?.idx > 0) navigate(-1) // React Router zählt den Verlauf in idx
        else navigate('/')
    }

    return (
        <div className="page add-page">
            <div className="page-head">
                <div>
                    <h1 className="page-title">Buch erfassen</h1>
                    <p className="add-page-lead">ISBN eintippen, Angaben prüfen, Standort wählen.</p>
                </div>
                <Link
                    to={slotParam ? `/erfassen/ohne-isbn?slot=${slotParam}` : '/erfassen/ohne-isbn'}
                    className="add-page-switch"
                >
                    Buch ohne ISBN erfassen
                </Link>
            </div>

            <div className="add-layout">
                <section className="add-card" aria-label="Angaben zum Buch">
                    {saved && <SavedNotice result={saved} />}

                    <IsbnLookupForm
                        value={isbn}
                        onChange={handleIsbnChange}
                        onLookup={() => runLookup()}
                        error={errors.isbn}
                        loading={lookup.status === 'loading'}
                        inputRef={isbnInputRef}
                    />

                    <LookupNotices lookup={lookup} onRetry={() => runLookup()} />

                    <div className="add-divider" />

                    <form className="add-book-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
                        <BookFormFields
                            values={{ ...book, shelfSlotId: slotValue }}
                            errors={errors}
                            onChange={handleFieldChange}
                            locations={{
                                groups: slotGroups,
                                loading: locations.loading && !locations.data,
                                error: locations.error,
                                reload: locations.reload,
                            }}
                        />

                        {saveError && (
                            <Notice variant="error" role="alert" title={`Speichern hat nicht geklappt: ${saveError.message}`}>
                                Die Angaben bleiben stehen. Nochmals „Buch speichern“ versuchen.
                            </Notice>
                        )}

                        <div className="add-actions">
                            <button type="submit" className="btn btn-primary add-save" disabled={!canSave}>
                                {saving ? 'Wird gespeichert …' : 'Buch speichern'}
                            </button>
                            <button type="button" className="btn btn-secondary add-cancel" onClick={handleCancel}>
                                Abbrechen
                            </button>
                            {blockedReason && !saving && <span className="add-blocked">{blockedReason}</span>}
                        </div>
                    </form>
                </section>

                <aside className="add-side">
                    <CoverPicker
                        online={onlineCover}
                        cover={cover}
                        onChoose={(choice) => setCover((prev) => ({ ...prev, choice, error: null }))}
                        onUpload={handleUpload}
                    />
                    <LookupSources lookup={lookup} onRefresh={() => runLookup({ refresh: true })} />
                </aside>
            </div>
        </div>
    )
}

// Grüne Box oben nach dem Speichern, mit Weg zur Reihe und zum Buch
function SavedNotice({ result }) {
    const { book, warnings = [] } = result
    const duplicate = warnings.some((warning) => warning.code === 'DUPLICATE_ISBN')
    const coverFailed = warnings.some((warning) => warning.code === 'COVER_NOT_SAVED')
    const place = [book.location.room, placeLabel(book.location)].filter(Boolean).join(', ')

    return (
        <Notice
            variant={coverFailed ? 'caution' : 'success'}
            title={`„${book.title}“ ist gespeichert, in ${place}`}
            action={
                <>
                    <Link to={`/regal/${book.location.slotId}`} className="btn btn-secondary">
                        Zur Reihe
                    </Link>
                    <Link to={`/buecher/${book.id}`} className="btn btn-secondary">
                        Buch ansehen
                    </Link>
                </>
            }
        >
            {duplicate && 'Ein weiteres Exemplar, die ISBN stand schon im Bestand. '}
            {coverFailed && 'Das Cover wurde nicht gespeichert, es lässt sich im Buchdetail nachtragen. '}
            Das Formular ist leer für das nächste Buch.
        </Notice>
    )
}

// ---------- Hilfsfunktionen ----------

// data aus GET /api/isbn -> Formularwerte (alles Strings).
// Der Untertitel hat keine eigene Spalte und wird an den Titel gehängt:
// "Das Parfum" + "Die Geschichte eines Mörders" -> "Das Parfum. Die Geschichte eines Mörders"
function fieldsFromLookup(data) {
    return {
        title: joinTitle(data.title, data.subtitle),
        author: data.author ?? '',
        publisher: data.publisher ?? '',
        publishedYear: data.publishedYear ? String(data.publishedYear) : '',
        language: data.language ?? '',
        pages: data.pages ? String(data.pages) : '',
    }
}

// Felder leeren, die noch genau so dastehen, wie der Abruf sie eingetragen hat
function clearUnchanged(book, filled) {
    const next = { ...book }
    for (const [name, value] of Object.entries(filled)) {
        if (next[name] === value) next[name] = ''
    }
    return next
}

function joinTitle(title, subtitle) {
    if (!title) return subtitle ?? ''
    if (!subtitle || title.toLowerCase().includes(subtitle.toLowerCase())) return title
    return /[.!?:]$/.test(title) ? `${title} ${subtitle}` : `${title}. ${subtitle}`
}

// Formular -> Body für POST /api/books. Prüft, was das Backend sonst mit 400 ablehnen würde.
function buildPayload({ isbn, book, slotValue, cover, onlineCover }) {
    const errors = {}

    const check = checkIsbn(isbn)
    if (check.state !== 'empty' && check.state !== 'valid') {
        errors.isbn = isbnProblem(check)
    }

    const publishedYear = parseOptionalInt(book.publishedYear)
    if (publishedYear === undefined || (publishedYear !== null && (publishedYear < 1400 || publishedYear > 2100))) {
        errors.publishedYear = 'Jahr mit vier Ziffern, zwischen 1400 und 2100'
    }

    const pages = parseOptionalInt(book.pages)
    if (pages === undefined || pages === 0) {
        errors.pages = 'Nur Ziffern, mindestens 1'
    }

    const coverTempId =
        cover.choice === 'online' ? onlineCover?.tempId
            : cover.choice === 'upload' ? cover.upload?.tempId
                : null

    if (Object.keys(errors).length > 0) return { payload: null, errors }

    return {
        errors: null,
        payload: {
            isbn: check.state === 'valid' ? check.isbn : null,
            title: book.title.trim(),
            author: book.author.trim(),
            publisher: book.publisher.trim() || null,
            publishedYear,
            language: book.language || null,
            pages,
            note: book.note.trim() || null,
            shelfSlotId: Number(slotValue),
            coverTempId: coverTempId ?? null,
        },
    }
}

// "" -> null, "320" -> 320, "32a" -> undefined (ungültig)
function parseOptionalInt(value) {
    const trimmed = value.trim()
    if (trimmed === '') return null
    if (!/^\d+$/.test(trimmed)) return undefined
    return Number(trimmed)
}

function uploadErrorMessage(error) {
    if (error.status === 413) return 'Das Bild ist grösser als 10 MB. Bitte ein kleineres wählen.'
    if (error.status === 400) return error.fields?.file ?? error.message
    return `Hochladen hat nicht geklappt: ${error.message}`
}

function focusFirstError(errors) {
    const key = Object.keys(FIELD_IDS).find((name) => errors[name])
    if (key) document.getElementById(FIELD_IDS[key])?.focus()
}

function omit(object, keys) {
    const copy = { ...object }
    for (const key of keys) delete copy[key]
    return copy
}