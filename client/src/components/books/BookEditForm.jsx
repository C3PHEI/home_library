import { useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { getLocations } from '../../api/locations.js'
import { uploadCover } from '../../api/covers.js'
import { deleteBookCover, moveBook, setBookCover, updateBook } from '../../api/books.js'
import { useApi } from '../../hooks/useApi.js'
import { checkIsbn, isbnProblem } from '../../utils/isbn.js'
import { slotOptionGroups } from '../../utils/location.js'
import { joinGerman } from '../../utils/format.js'
import {
    BOOK_FIELD_IDS,
    EMPTY_COVER,
    bookPayloadFields,
    coverFileProblem,
    focusFirstError,
    missingRequired,
    omit,
    uploadErrorMessage,
    validSlotValue,
} from '../../utils/bookForm.js'
import Notice from '../Notice.jsx'
import BookFormFields from './BookFormFields.jsx'
import CoverSection from '../add/CoverSection.jsx'
import './BookEditForm.css'

// Feld -> id der Eingabe: dorthin springt der Fokus beim ersten Fehler
const FIELD_IDS = { ...BOOK_FIELD_IDS, isbn: 'book-isbn' }
// Felder, die PATCH /api/books/:id ändern darf (die ISBN wird getrennt verglichen)
const TEXT_FIELDS = ['title', 'author', 'publisher', 'publishedYear', 'language', 'pages', 'note']

// "Buch bearbeiten" aus dem neuen Mock: dieselben Felder wie beim Hinzufügen,
// dazu Standort und Cover. Gespeichert wird nur, was sich geändert hat:
//   Angaben   PATCH  /api/books/:id
//   Standort  PATCH  /api/books/:id/location
//   Cover     PUT oder DELETE /api/books/:id/cover
//
// book:       das Buch aus GET /api/books/:id
// onSaved:    (book, warnings) => void   alles gespeichert
// onProgress: (book) => void             ein Teil ist gespeichert, dann kam ein Fehler
// onCancel:   () => void
export default function BookEditForm({ book, onSaved, onProgress, onCancel }) {
    const locations = useApi(getLocations)
    const slotGroups = useMemo(
        () => (locations.data ? slotOptionGroups(locations.data.rooms) : []),
        [locations.data],
    )

    const [values, setValues] = useState(() => valuesFromBook(book))
    const [isbn, setIsbn] = useState(book.isbn13 ?? book.isbn10 ?? '')
    const [cover, setCover] = useState({ ...EMPTY_COVER, choice: book.coverUrl ? 'current' : 'none' })
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)

    // Zählt Uploads hoch: ein Bild, das nach einem neueren Upload noch zurückkommt, wird verworfen
    const uploadRun = useRef(0)

    // Solange die Standorte laden, gilt der Standort als nicht gewählt
    const slotValue = validSlotValue(slotGroups, values.shelfSlotId)

    const missing = missingRequired(values, slotValue)
    let blockedReason = null
    if (locations.loading && !locations.data) blockedReason = 'Standorte werden geladen …'
    else if (cover.uploading) blockedReason = 'Warte auf das Bild …'
    else if (missing.length > 0) blockedReason = `Noch nötig: ${joinGerman(missing)}`
    const canSave = !blockedReason && !saving

    const isbnCheck = checkIsbn(isbn)

    function handleFieldChange(name, value) {
        setValues((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors((prev) => omit(prev, [name]))
    }

    function handleIsbnChange(value) {
        setIsbn(value)
        if (errors.isbn) setErrors((prev) => omit(prev, ['isbn']))
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

    async function handleSubmit(event) {
        event.preventDefault()
        if (!canSave) return

        const { fields, errors: inputErrors } = bookPayloadFields(values, slotValue)
        if (isbnCheck.state !== 'empty' && isbnCheck.state !== 'valid') {
            inputErrors.isbn = isbnProblem(isbnCheck)
        }
        if (Object.keys(inputErrors).length > 0) {
            setErrors(inputErrors)
            focusFirstError(inputErrors, FIELD_IDS)
            return
        }

        // Was hat sich geändert?
        const changes = changedFields(book, fields, isbnCheck)
        const moveTo = fields.shelfSlotId !== book.location.slotId ? fields.shelfSlotId : null
        const newCoverId = cover.choice === 'upload' ? cover.upload?.tempId : null
        const removeCover = cover.choice === 'none' && Boolean(book.coverUrl)

        if (Object.keys(changes).length === 0 && !moveTo && !newCoverId && !removeCover) {
            onCancel() // nichts geändert
            return
        }

        setSaving(true)
        setSaveError(null)

        // Der Reihe nach speichern. latest ist das Buch, wie es der Server zuletzt geliefert hat.
        let latest = book
        let warnings = []
        try {
            if (Object.keys(changes).length > 0) {
                const result = await updateBook(book.id, changes)
                latest = result.book
                warnings = result.warnings ?? []
            }
            if (moveTo) latest = await moveBook(book.id, moveTo)
            if (newCoverId) latest = await setBookCover(book.id, newCoverId)
            else if (removeCover) latest = await deleteBookCover(book.id)

            onSaved(latest, warnings)
        } catch (error) {
            // Ein Teil ist vielleicht schon gespeichert: der Seite das neue Buch melden,
            // damit beim nächsten Versuch nur noch der Rest gespeichert wird
            if (latest !== book) onProgress(latest)
            handleSaveError(error)
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
        focusFirstError(fieldErrors, FIELD_IDS)

        // Fehler ohne passendes Feld (Server weg, 500, ...) über den Knöpfen zeigen
        const shown = Object.keys(fieldErrors).some((key) => key in FIELD_IDS) || coverTempId
        if (!shown) setSaveError(error)
    }

    return (
        <div className="card edit-card">
            <div className="eyebrow">Buch bearbeiten</div>
            <h2 className="edit-title">Angaben ändern</h2>

            <div className="edit-grid">
                <form
                    id="edit-book-form"
                    className="edit-section"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-busy={saving}
                    aria-label="Buchangaben"
                >
                    <BookFormFields
                        values={{ ...values, shelfSlotId: slotValue }}
                        errors={errors}
                        onChange={handleFieldChange}
                        isbn={{
                            value: isbn,
                            onChange: handleIsbnChange,
                            error: errors.isbn ?? (isbnCheck.state === 'invalid' ? isbnCheck.message : undefined),
                        }}
                        locations={{
                            groups: slotGroups,
                            loading: locations.loading && !locations.data,
                            error: locations.error,
                            reload: locations.reload,
                        }}
                    />
                </form>

                <section className="edit-section" aria-labelledby="edit-cover-title">
                    <h3 id="edit-cover-title" className="edit-section-title">
                        Cover
                    </h3>

                    <CoverSection
                        current={book.coverUrl ? { previewUrl: book.coverUrl } : null}
                        cover={cover}
                        onChoose={(choice) => setCover((prev) => ({ ...prev, choice, error: null }))}
                        onUpload={handleUpload}
                    />
                </section>
            </div>

            {saveError && (
                <Notice variant="error" role="alert" title={`Speichern hat nicht geklappt: ${saveError.message}`}>
                    Die Angaben bleiben stehen. Nochmals „Speichern“ versuchen.
                </Notice>
            )}

            {/* Die Knöpfe stehen ausserhalb des Formulars und gehören über form="..." dazu */}
            <div className="edit-actions">
                {blockedReason && !saving && <span className="edit-blocked">{blockedReason}</span>}
                <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
                    Abbrechen
                </button>
                <button type="submit" form="edit-book-form" className="btn btn-primary" disabled={!canSave}>
                    <Check size={16} aria-hidden="true" />
                    {saving ? 'Wird gespeichert …' : 'Speichern'}
                </button>
            </div>
        </div>
    )
}

// Buch aus der API -> Formularwerte (alles Strings)
function valuesFromBook(book) {
    return {
        title: book.title ?? '',
        author: book.author ?? '',
        publisher: book.publisher ?? '',
        publishedYear: book.publishedYear ? String(book.publishedYear) : '',
        language: book.language ?? '',
        pages: book.pages ? String(book.pages) : '',
        shelfSlotId: String(book.location.slotId),
        note: book.note ?? '',
    }
}

// Nur die Felder, die anders sind als im gespeicherten Buch -> Body für PATCH /api/books/:id
function changedFields(book, fields, isbnCheck) {
    const changes = {}
    for (const key of TEXT_FIELDS) {
        if (fields[key] !== (book[key] ?? null)) changes[key] = fields[key]
    }

    // Dieselbe ISBN in der anderen Schreibweise (10 statt 13 Stellen) gilt als unverändert
    const nextIsbn = isbnCheck.state === 'valid' ? isbnCheck.isbn : null
    const sameIsbn = nextIsbn === null
        ? !book.isbn13 && !book.isbn10
        : nextIsbn === book.isbn13 || nextIsbn === book.isbn10
    if (!sameIsbn) changes.isbn = nextIsbn

    return changes
}