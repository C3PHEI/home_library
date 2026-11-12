import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { getLocations } from '../api/locations.js'
import { lookupIsbn } from '../api/isbn.js'
import { uploadCover } from '../api/covers.js'
import { createBook } from '../api/books.js'
import { useApi } from '../hooks/useApi.js'
import { checkIsbn, cleanIsbn, isbnProblem } from '../utils/isbn.js'
import { slotOptionGroups } from '../utils/location.js'
import { joinGerman } from '../utils/format.js'
import {
    BOOK_FIELD_IDS,
    EMPTY_BOOK,
    EMPTY_COVER,
    bookPayloadFields,
    coverFileProblem,
    focusFirstError,
    missingRequired,
    omit,
    uploadErrorMessage,
    validSlotValue,
} from '../utils/bookForm.js'
import Notice from '../components/Notice.jsx'
import PageHead from '../components/PageHead.jsx'
import Segmented from '../components/Segmented.jsx'
import BookFormFields from '../components/books/BookFormFields.jsx'
import IsbnLookupForm from '../components/add/IsbnLookupForm.jsx'
import LookupNotices from '../components/add/LookupNotices.jsx'
import LookupSources from '../components/add/LookupSources.jsx'
import CoverSection from '../components/add/CoverSection.jsx'
import SavedNotice from '../components/add/SavedNotice.jsx'
import './AddBookPage.css'

const IDLE = { status: 'idle' }

const MODES = [
    { value: 'isbn', label: 'Mit ISBN beginnen' },
    { value: 'manual', label: 'Manuell eintragen' },
]
const MODE_PATHS = { isbn: '/erfassen', manual: '/erfassen/ohne-isbn' }

// Felder, die der ISBN-Abruf ausfüllt (Standort und Notiz bleiben, wie sie sind)
const LOOKUP_FIELDS = ['title', 'author', 'publisher', 'publishedYear', 'language', 'pages']

// Feld -> id der Eingabe: dorthin springt der Fokus beim ersten Fehler.
// Mit ISBN steht das ISBN-Feld oben, beim manuellen Eintragen bei den Buchangaben.
const FIELD_IDS = {
    isbn: { isbn: 'isbn', ...BOOK_FIELD_IDS },
    manual: { ...BOOK_FIELD_IDS, isbn: 'book-isbn' },
}

// Buch hinzufügen (neuer Mock): eine Seite mit Umschalter.
//   /erfassen            "Mit ISBN beginnen": ISBN eintippen -> "Daten holen" füllt das Formular
//   /erfassen/ohne-isbn  "Manuell eintragen": alles wird getippt, die ISBN ist freiwillig
// Aus einer leeren Reihe kommt der Standort mit: /erfassen?slot=17
// Beim Umschalten bleiben alle Eingaben stehen. Nach dem Speichern ist alles leer
// für das nächste Buch.
export default function AddBookPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const slotParam = searchParams.get('slot')
    const mode = params.mode === 'ohne-isbn' ? 'manual' : 'isbn'

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
    // Zählt Uploads hoch: ein Bild, das nach dem Speichern oder einem neueren Upload
    // noch zurückkommt, wird verworfen
    const uploadRun = useRef(0)

    // Seite verlassen: laufenden Abruf abbrechen
    useEffect(() => () => lookupController.current?.abort(), [])

    // Standort aus ?slot=, den es nicht (mehr) gibt, gilt als nicht gewählt
    const slotValue = validSlotValue(slotGroups, book.shelfSlotId)

    const onlineCover = lookup.status === 'done' ? lookup.result.cover : null

    // Speichern erst, wenn die Pflichtfelder stehen
    const missing = missingRequired(book, slotValue)
    let blockedReason = null
    if (lookup.status === 'loading') blockedReason = 'Warte auf den Abruf …'
    else if (cover.uploading) blockedReason = 'Warte auf das Bild …'
    else if (missing.length > 0) blockedReason = `Noch nötig: ${joinGerman(missing)}`
    const canSave = !blockedReason && !saving

    // ---------- Umschalter ----------

    function handleModeChange(nextMode) {
        // Ein laufender Abruf würde beim manuellen Eintragen unsichtbar das Speichern sperren
        if (nextMode === 'manual' && lookup.status === 'loading') {
            lookupController.current?.abort()
            setLookup(IDLE)
        }
        setErrors((prev) => omit(prev, ['isbn']))
        // ?slot= mitnehmen, kein neuer Eintrag im Verlauf
        navigate({ pathname: MODE_PATHS[nextMode], search: location.search }, { replace: true })
    }

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
        const problem = coverFileProblem(file)
        if (problem) {
            setCover((prev) => ({ ...prev, error: problem }))
            return
        }

        const run = ++uploadRun.current
        setCover((prev) => ({ ...prev, uploading: true, error: null }))
        try {
            const upload = await uploadCover(file)
            if (run !== uploadRun.current) return
            setCover((prev) => ({ ...prev, uploading: false, upload, choice: 'upload' }))
        } catch (error) {
            if (run !== uploadRun.current) return
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
            focusFirstError(inputErrors, FIELD_IDS[mode])
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
            setCover((prev) => ({ ...prev, error: `${coverTempId} Bitte das Bild nochmals auswählen.` }))
        }
        setErrors(fieldErrors)
        focusFirstError(fieldErrors, FIELD_IDS[mode])

        // Fehler ohne passendes Feld (Server weg, 500, ...) über den Knöpfen zeigen
        const shown = Object.keys(fieldErrors).some((key) => key in FIELD_IDS[mode]) || coverTempId
        if (!shown) setSaveError(error)
    }

    // Nach dem Speichern: alles leer, auch der Standort (Anforderungsliste, "Entschieden")
    function resetForm() {
        lookupController.current?.abort()
        uploadRun.current++
        setIsbn('')
        setLookup(IDLE)
        setBook(EMPTY_BOOK)
        setCover(EMPTY_COVER)
        setErrors({})
        if (slotParam) setSearchParams({}, { replace: true })

        window.scrollTo({ top: 0, behavior: 'smooth' })
        const first = mode === 'isbn' ? isbnInputRef.current : document.getElementById(BOOK_FIELD_IDS.title)
        first?.focus({ preventScroll: true })
    }

    function handleCancel() {
        if (slotParam) navigate(`/regal/${slotParam}`)
        else if (window.history.state?.idx > 0) navigate(-1) // React Router zählt den Verlauf in idx
        else navigate('/')
    }

    // ISBN-Feld bei den Buchangaben (nur "Manuell eintragen"): falsche Zeichen sofort zeigen
    const isbnCheck = checkIsbn(isbn)
    const manualIsbn = {
        value: isbn,
        onChange: handleIsbnChange,
        error: errors.isbn ?? (isbnCheck.state === 'invalid' ? isbnCheck.message : undefined),
    }

    return (
        <div className="page add-page">
            <PageHead
                eyebrow="Ein neues Zuhause fürs Buch"
                title="Buch hinzufügen"
                lead="Ein paar Angaben reichen – alles andere ist optional."
            />

            <div className="add-mode">
                <Segmented label="Art der Eingabe" options={MODES} value={mode} onChange={handleModeChange} />
            </div>

            <div className="card add-card">
                {saved && <SavedNotice result={saved} />}

                {/* Breiter Bildschirm: zwei Spalten (AddBookPage.css), sonst alles untereinander */}
                <div className={mode === 'isbn' ? 'add-grid has-isbn' : 'add-grid'}>
                    {mode === 'isbn' && (
                        <section className="add-section add-area-isbn" aria-labelledby="add-isbn-title">
                            <h2 id="add-isbn-title" className="add-section-title">
                                ISBN-Eingabe
                            </h2>

                            <IsbnLookupForm
                                value={isbn}
                                onChange={handleIsbnChange}
                                onLookup={() => runLookup()}
                                error={errors.isbn}
                                loading={lookup.status === 'loading'}
                                inputRef={isbnInputRef}
                            />

                            <LookupSources lookup={lookup} onRefresh={() => runLookup({ refresh: true })} />
                            <LookupNotices lookup={lookup} onRetry={() => runLookup()} />
                        </section>
                    )}

                    <form
                        id="add-book-form"
                        className="add-section add-area-fields"
                        onSubmit={handleSubmit}
                        noValidate
                        aria-busy={saving}
                        aria-labelledby="add-fields-title"
                    >
                        <h2 id="add-fields-title" className="add-section-title">
                            Buchangaben
                        </h2>

                        <BookFormFields
                            values={{ ...book, shelfSlotId: slotValue }}
                            errors={errors}
                            onChange={handleFieldChange}
                            isbn={mode === 'manual' ? manualIsbn : undefined}
                            locations={{
                                groups: slotGroups,
                                loading: locations.loading && !locations.data,
                                error: locations.error,
                                reload: locations.reload,
                            }}
                        />
                    </form>

                    <section className="add-section add-area-cover" aria-labelledby="add-cover-title">
                        <h2 id="add-cover-title" className="add-section-title">
                            Cover
                        </h2>

                        <CoverSection
                            online={onlineCover}
                            cover={cover}
                            onChoose={(choice) => setCover((prev) => ({ ...prev, choice, error: null }))}
                            onUpload={handleUpload}
                            withLookup={mode === 'isbn'}
                        />
                    </section>
                </div>

                {saveError && (
                    <Notice variant="error" role="alert" title={`Speichern hat nicht geklappt: ${saveError.message}`}>
                        Die Angaben bleiben stehen. Nochmals „Buch speichern“ versuchen.
                    </Notice>
                )}

                {/* Die Knöpfe stehen ausserhalb des Formulars und gehören über form="..." dazu */}
                <div className="add-actions">
                    {blockedReason && !saving && <span className="add-blocked">{blockedReason}</span>}
                    <button type="button" className="btn btn-outline" onClick={handleCancel}>
                        Abbrechen
                    </button>
                    <button type="submit" form="add-book-form" className="btn btn-primary" disabled={!canSave}>
                        <Check size={16} aria-hidden="true" />
                        {saving ? 'Wird gespeichert …' : 'Buch speichern'}
                    </button>
                </div>
            </div>
        </div>
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
// Die ISBN ist freiwillig: leer -> null. Steht etwas drin, muss die Prüfziffer stimmen.
function buildPayload({ isbn, book, slotValue, cover, onlineCover }) {
    const { fields, errors } = bookPayloadFields(book, slotValue)

    const check = checkIsbn(isbn)
    if (check.state !== 'empty' && check.state !== 'valid') {
        errors.isbn = isbnProblem(check)
    }

    const coverTempId =
        cover.choice === 'online' ? onlineCover?.tempId
            : cover.choice === 'upload' ? cover.upload?.tempId
                : null

    if (Object.keys(errors).length > 0) return { payload: null, errors }

    return {
        errors: null,
        payload: {
            ...fields,
            isbn: check.state === 'valid' ? check.isbn : null,
            coverTempId: coverTempId ?? null,
        },
    }
}