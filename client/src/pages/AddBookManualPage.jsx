import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getLocations } from '../api/locations.js'
import { uploadCover } from '../api/covers.js'
import { createBook } from '../api/books.js'
import { useApi } from '../hooks/useApi.js'
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
import BookFormFields from '../components/books/BookFormFields.jsx'
import CoverUpload from '../components/add/CoverUpload.jsx'
import RequiredFields from '../components/add/RequiredFields.jsx'
import SavedNotice from '../components/add/SavedNotice.jsx'
// Layout (.add-layout, .add-card, .side-card, ...) teilt sich die Seite mit "Erfassen über ISBN"
import './AddBookIsbnPage.css'

const PLACEHOLDERS = {
    title: 'Zum Beispiel Sansibar oder der letzte Grund',
    author: 'Zum Beispiel Alfred Andersch',
    note: 'Freitext',
}

// Erfassen ohne ISBN: /erfassen/ohne-isbn (aus einer leeren Reihe: /erfassen/ohne-isbn?slot=17)
// Für alte Bücher ohne ISBN. Es wird nichts abgerufen, alles wird getippt.
// Titel, Autor und Standort sind Pflicht, Cover nur als eigenes Foto.
// Nach dem Speichern ist alles leer für das nächste Buch.
export default function AddBookManualPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const slotParam = searchParams.get('slot')

    const locations = useApi(getLocations)
    const slotGroups = useMemo(
        () => (locations.data ? slotOptionGroups(locations.data.rooms) : []),
        [locations.data],
    )

    const [book, setBook] = useState(() => ({ ...EMPTY_BOOK, shelfSlotId: slotParam ?? '' }))
    const [cover, setCover] = useState(EMPTY_COVER)
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [saved, setSaved] = useState(null)

    // Zählt Uploads hoch: ein Bild, das nach "Entfernen" oder einem neueren Upload
    // noch zurückkommt, wird verworfen
    const uploadRun = useRef(0)

    const slotValue = validSlotValue(slotGroups, book.shelfSlotId)

    // Speichern erst, wenn die Pflichtfelder stehen
    const missing = missingRequired(book, slotValue)
    let blockedReason = null
    if (cover.uploading) blockedReason = 'Warte auf das Bild …'
    else if (missing.length > 0) blockedReason = `Noch nötig: ${joinGerman(missing)}`
    const canSave = !blockedReason && !saving

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
            setCover({ ...EMPTY_COVER, choice: 'upload', upload })
        } catch (error) {
            if (run !== uploadRun.current) return
            setCover((prev) => ({ ...prev, uploading: false, error: uploadErrorMessage(error) }))
        }
    }

    // Die vorläufige Datei bleibt auf dem Server liegen und wird dort nach 24 Stunden aufgeräumt
    function handleRemoveCover() {
        uploadRun.current++
        setCover(EMPTY_COVER)
    }

    // ---------- Speichern ----------

    async function handleSubmit(event) {
        event.preventDefault()
        if (!canSave) return

        const { fields, errors: inputErrors } = bookPayloadFields(book, slotValue)
        if (Object.keys(inputErrors).length > 0) {
            setErrors(inputErrors)
            focusFirstError(inputErrors, BOOK_FIELD_IDS)
            return
        }

        setSaving(true)
        setSaveError(null)
        setSaved(null)
        try {
            const result = await createBook({
                ...fields,
                isbn: null,
                coverTempId: cover.upload?.tempId ?? null,
            })
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
            // z. B. vorläufiges Cover nach 24 Stunden aufgeräumt: Bild nochmals wählen
            setCover({ ...EMPTY_COVER, error: `${coverTempId} Bitte das Bild nochmals auswählen.` })
        }
        setErrors(fieldErrors)
        focusFirstError(fieldErrors, BOOK_FIELD_IDS)

        // Fehler ohne passendes Feld (Server weg, 500, ...) oben am Knopf zeigen
        const shown = Object.keys(fieldErrors).some((key) => key in BOOK_FIELD_IDS) || coverTempId
        if (!shown) setSaveError(error)
    }

    // Nach dem Speichern: alles leer, auch der Standort (Anforderungsliste, "Entschieden")
    function resetForm() {
        uploadRun.current++
        setBook(EMPTY_BOOK)
        setCover(EMPTY_COVER)
        setErrors({})
        if (slotParam) setSearchParams({}, { replace: true })

        window.scrollTo({ top: 0, behavior: 'smooth' })
        document.getElementById(BOOK_FIELD_IDS.title)?.focus({ preventScroll: true })
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
                    <h1 className="page-title">Buch ohne ISBN erfassen</h1>
                    <p className="add-page-lead">Titel, Autor und Standort genügen. Alles andere ist freiwillig.</p>
                </div>
                <Link to={slotParam ? `/erfassen?slot=${slotParam}` : '/erfassen'} className="add-page-switch">
                    Doch mit ISBN erfassen
                </Link>
            </div>

            <div className="add-layout">
                <section className="add-card" aria-label="Angaben zum Buch">
                    {saved ? (
                        <SavedNotice result={saved} />
                    ) : (
                        <Notice variant="accent" title="Der Notausgang für alte Bücher ohne ISBN">
                            Es wird nichts abgerufen, alle Angaben werden getippt. Hat das Buch doch eine ISBN, geht
                            es über „Doch mit ISBN erfassen“ schneller.
                        </Notice>
                    )}

                    <form className="add-book-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
                        <BookFormFields
                            values={{ ...book, shelfSlotId: slotValue }}
                            errors={errors}
                            onChange={handleFieldChange}
                            placeholders={PLACEHOLDERS}
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
                    <CoverUpload cover={cover} onUpload={handleUpload} onRemove={handleRemoveCover} />
                    <RequiredFields missing={missing} />
                </aside>
            </div>
        </div>
    )
}