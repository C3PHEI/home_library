import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Pencil, Trash2 } from 'lucide-react'
import { deleteBook, getBook } from '../api/books.js'
import { useApi } from '../hooks/useApi.js'
import { languageLabel } from '../utils/languages.js'
import { placeLabel } from '../utils/location.js'
import { sourceLabel } from '../components/add/sources.js'
import Dialog from '../components/Dialog.jsx'
import Notice from '../components/Notice.jsx'
import BookCover from '../components/books/BookCover.jsx'
import BookEditForm from '../components/books/BookEditForm.jsx'
import './BookDetailPage.css'

// Buchdetail: /buecher/:bookId
// Ansehen, bearbeiten (Angaben, Standort, Cover) und löschen.
// Der Rückweg führt dorthin, woher man kam (Liste, Suche oder Fach).
export default function BookDetailPage() {
    const bookId = Number(useParams().bookId)
    const navigate = useNavigate()
    const location = useLocation()
    const back = backTarget(location.state?.from)

    const loadBook = useCallback((options) => getBook(bookId, options), [bookId])
    const loaded = useApi(loadBook)

    // Nach dem Speichern liefert der Server das Buch gleich mit: das gilt dann statt des geladenen
    const [savedBook, setSavedBook] = useState(null)
    const [editing, setEditing] = useState(false)
    const [notice, setNotice] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState(null)

    // Beim Wechsel zu einem anderen Buch nichts vom vorherigen zeigen
    const fresh = savedBook?.id === bookId ? savedBook : loaded.data?.id === bookId ? loaded.data : null

    const backLink = (
        <Link to={back.to} className="back-link">
            <ArrowLeft size={15} aria-hidden="true" />
            {back.label}
        </Link>
    )

    if (loaded.error && !fresh) {
        const notFound = loaded.error.status === 404 || loaded.error.status === 400
        return (
            <div className="page book-detail-page">
                {backLink}
                <div className="card detail-missing" role="alert">
                    <h2>{notFound ? 'Buch nicht gefunden' : 'Das Buch konnte nicht geladen werden'}</h2>
                    <p>
                        {notFound
                            ? 'Dieses Buch gibt es nicht oder es wurde gelöscht.'
                            : loaded.error.message}
                    </p>
                    {notFound ? (
                        <Link to="/buecher" className="btn btn-primary">
                            Zur Bücherliste
                        </Link>
                    ) : (
                        <button type="button" className="btn btn-secondary" onClick={loaded.reload}>
                            Nochmals versuchen
                        </button>
                    )}
                </div>
            </div>
        )
    }

    if (!fresh) {
        return (
            <div className="page book-detail-page" aria-busy="true">
                {backLink}
                <p className="state-message">Buch wird geladen …</p>
            </div>
        )
    }

    const book = fresh

    function startEditing() {
        setNotice(null)
        setEditing(true)
        window.scrollTo({ top: 0 })
    }

    function handleSaved(nextBook, warnings) {
        setSavedBook(nextBook)
        setEditing(false)
        setNotice({ duplicate: warnings.find((warning) => warning.code === 'DUPLICATE_ISBN') ?? null })
        window.scrollTo({ top: 0 })
    }

    function closeDeleteDialog() {
        if (deleting) return
        setConfirmDelete(false)
        setDeleteError(null)
    }

    async function handleDelete() {
        setDeleting(true)
        setDeleteError(null)
        try {
            await deleteBook(book.id)
            // Zurück zur Liste, das gelöschte Buch soll nicht im Verlauf bleiben
            navigate(back.to, { replace: true })
        } catch (error) {
            if (error.status === 404) {
                navigate(back.to, { replace: true }) // war schon gelöscht
                return
            }
            setDeleteError(error)
            setDeleting(false)
        }
    }

    return (
        <div className="page book-detail-page">
            {backLink}

            {editing ? (
                <BookEditForm
                    key={book.id}
                    book={book}
                    onSaved={handleSaved}
                    onProgress={setSavedBook}
                    onCancel={() => setEditing(false)}
                />
            ) : (
                <>
                    {notice && (
                        <Notice variant="success" title="Änderungen gespeichert.">
                            {notice.duplicate &&
                                `Diese ISBN steht noch ${notice.duplicate.existing.length === 1 ? 'bei einem weiteren Buch' : `bei ${notice.duplicate.existing.length} weiteren Büchern`} im Bestand. Das ist kein Fehler.`}
                        </Notice>
                    )}

                    <article className="card detail-card">
                        <BookCover src={book.coverUrl} variant="detail" />

                        <header className="detail-head">
                            <div className="eyebrow">In deiner Bibliothek</div>
                            <h1 className="detail-title">{book.title}</h1>
                            <div className="detail-authors">{book.author}</div>
                        </header>

                        <div className="detail-actions">
                            <button type="button" className="btn btn-primary" onClick={startEditing}>
                                <Pencil size={15} aria-hidden="true" />
                                Bearbeiten
                            </button>
                            <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(true)}>
                                <Trash2 size={15} aria-hidden="true" />
                                Löschen
                            </button>
                        </div>

                        <dl className="detail-grid">
                            <DetailItem label="Standort">
                                <Link to={`/regal/${book.location.slotId}`} className="detail-location">
                                    <MapPin size={13} aria-hidden="true" />
                                    <span>
                                        {placeLabel(book.location)}
                                        {book.location.room && ` · ${book.location.room}`}
                                    </span>
                                </Link>
                            </DetailItem>
                            <DetailItem label="ISBN" value={book.isbn13 ?? book.isbn10} mono />
                            <DetailItem label="Verlag" value={book.publisher} />
                            <DetailItem label="Erscheinungsjahr" value={book.publishedYear} />
                            <DetailItem label="Sprache" value={book.language && languageLabel(book.language)} />
                            <DetailItem label="Seiten" value={book.pages} />
                            <DetailItem label="Hinzugefügt" value={formatDate(book.createdAt)} />
                            <DetailItem label="Zuletzt geändert" value={formatDate(book.updatedAt)} />
                            {book.coverSource && (
                                <DetailItem label="Coverquelle" value={coverSourceLabel(book.coverSource)} />
                            )}
                            {book.note && <DetailItem label="Notiz" value={book.note} wide />}
                        </dl>
                    </article>
                </>
            )}

            {confirmDelete && (
                <Dialog
                    title="Buch wirklich löschen?"
                    description={`„${book.title}“ wird aus deiner Bibliothek entfernt. Das lässt sich nicht rückgängig machen.`}
                    icon={Trash2}
                    tone="danger"
                    busy={deleting}
                    onClose={closeDeleteDialog}
                    actions={
                        <>
                            <button type="button" className="btn btn-outline" onClick={closeDeleteDialog} disabled={deleting}>
                                Behalten
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                                <Trash2 size={15} aria-hidden="true" />
                                {deleting ? 'Wird gelöscht …' : 'Endgültig löschen'}
                            </button>
                        </>
                    }
                >
                    {deleteError && (
                        <Notice variant="error" role="alert" title={`Löschen hat nicht geklappt: ${deleteError.message}`} />
                    )}
                </Dialog>
            )}
        </div>
    )
}

// Eine Angabe im Raster: kleine Beschriftung, darunter der Wert.
// Fehlt der Wert, steht "Nicht eingetragen" (wie im Mock).
function DetailItem({ label, value, children, wide = false, mono = false }) {
    const empty = !children && (value === null || value === undefined || value === '')
    return (
        <div className={wide ? 'detail-item is-wide' : 'detail-item'}>
            <dt>{label}</dt>
            <dd className={empty ? 'is-empty' : mono ? 'is-mono' : undefined}>
                {children ?? (empty ? 'Nicht eingetragen' : value)}
            </dd>
        </div>
    )
}

// Woher kam man? -> Ziel und Text für "Zurück"
function backTarget(from) {
    if (typeof from === 'string' && from.startsWith('/suche')) return { to: from, label: 'Zurück zur Suche' }
    if (typeof from === 'string' && from.startsWith('/regal')) return { to: from, label: 'Zurück zum Fach' }
    if (typeof from === 'string' && from.startsWith('/buecher')) return { to: from, label: 'Zurück zu allen Büchern' }
    return { to: '/buecher', label: 'Zurück zu allen Büchern' }
}

// "2026-10-06T19:19:03.646Z" -> "6. Oktober 2026"
function formatDate(value) {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })
}

// "upload" -> "Eigenes Bild", "openlibrary" -> "Open Library"
function coverSourceLabel(source) {
    return source === 'upload' ? 'Eigenes Bild' : sourceLabel(source)
}