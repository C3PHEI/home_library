import { useCallback, useEffect, useRef } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, ChevronRight, LayoutGrid, List } from 'lucide-react'
import { getSlot, getSlotBooks } from '../api/slots.js'
import { useApi } from '../hooks/useApi.js'
import { useStoredState } from '../hooks/useStoredState.js'
import { formatCount, plural } from '../utils/format.js'
import PageHead from '../components/PageHead.jsx'
import BookTile from '../components/books/BookTile.jsx'
import BookRow from '../components/books/BookRow.jsx'
import Pagination from '../components/Pagination.jsx'
import './SlotPage.css'

const SORT_OPTIONS = [
    { value: 'title', label: 'Titel' },
    { value: 'author', label: 'Autor' },
    { value: 'year', label: 'Erscheinungsjahr' },
    { value: 'created', label: 'Erfassungsdatum' },
]
const DEFAULT_SORT = 'title'
// Bücher pro Seite. Das Backend liefert höchstens 100 auf einmal.
const PAGE_SIZES = [12, 24, 48, 100]
const DEFAULT_PAGE_SIZE = 12

// Ein Fach (Reihe, Ablage) mit seinen Büchern: /regal/:slotId
// Sortierung und Seite stehen in der URL (?sort=author&page=2),
// die Ansicht (Cover oder Liste) und die Anzahl Bücher pro Seite merkt sich der Browser.
export default function SlotPage() {
    const slotId = Number(useParams().slotId)
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const sort = parseSort(searchParams.get('sort'))
    const page = parsePage(searchParams.get('page'))
    const [view, setView] = useStoredState('bibliothek.reihe.ansicht', 'tiles')
    // Gilt für beide Ansichten (Cover und Liste)
    const [storedPageSize, setPageSize] = useStoredState('bibliothek.reihe.proSeite', DEFAULT_PAGE_SIZE)
    const pageSize = PAGE_SIZES.includes(storedPageSize) ? storedPageSize : DEFAULT_PAGE_SIZE

    const loadSlot = useCallback((options) => getSlot(slotId, options), [slotId])
    const loadBooks = useCallback(
        (options) => getSlotBooks(slotId, { sort, page, limit: pageSize }, options),
        [slotId, sort, page, pageSize],
    )
    const slot = useApi(loadSlot)
    const books = useApi(loadBooks)

    // Beim Wechsel des Fachs keine Daten des vorherigen zeigen
    const header = slot.data?.id === slotId ? slot.data : null
    const list = books.data?.slotId === slotId ? books.data : null

    // Nach Seiten-, Sortier- oder Anzahlwechsel wieder oben beginnen
    const listKey = `${page}|${sort}|${pageSize}`
    const lastListKey = useRef(listKey)
    useEffect(() => {
        if (lastListKey.current === listKey) return // erster Aufruf (auch doppelt im StrictMode)
        lastListKey.current = listKey
        window.scrollTo({ top: 0 })
    }, [listKey])

    function updateParams(changes) {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                for (const [key, value] of Object.entries(changes)) {
                    if (value === null) next.delete(key)
                    else next.set(key, String(value))
                }
                return next
            },
            { replace: true },
        )
    }

    function handleSortChange(event) {
        const value = event.target.value
        updateParams({ sort: value === DEFAULT_SORT ? null : value, page: null })
    }

    // Andere Anzahl pro Seite: wieder bei Seite 1 beginnen
    function handlePageSizeChange(event) {
        setPageSize(Number(event.target.value))
        updateParams({ page: null })
    }

    function handlePageChange(nextPage) {
        updateParams({ page: nextPage === 1 ? null : nextPage })
    }

    const backLink = (
        <Link to="/" className="back-link">
            <ArrowLeft size={15} aria-hidden="true" />
            Zur Übersicht
        </Link>
    )

    if (slot.error) {
        const notFound = slot.error.status === 404 || slot.error.status === 400
        return (
            <div className="page slot-page">
                {backLink}
                <div className="state-message state-error" role="alert">
                    <span>
                        {notFound
                            ? 'Dieses Fach gibt es nicht.'
                            : `Das Fach konnte nicht geladen werden: ${slot.error.message}`}
                    </span>
                    {!notFound && (
                        <button type="button" className="btn btn-secondary" onClick={slot.reload}>
                            Nochmals versuchen
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const from = location.pathname + location.search
    const total = list?.total ?? header?.bookCount ?? 0
    const pageMissing = list && list.total > 0 && list.items.length === 0
    const addLink = `/erfassen?slot=${slotId}`

    return (
        <div className="page slot-page" aria-busy={slot.loading || books.loading}>
            {backLink}

            <PageHead
                eyebrow={header?.room ?? 'Standort'}
                title={header ? header.furniture.name : 'Fach wird geladen …'}
                lead={header ? leadText(header, total) : null}
                actions={
                    <Link to={addLink} className="btn btn-secondary">
                        <BookOpen size={16} aria-hidden="true" />
                        Buch hier hinzufügen
                    </Link>
                }
            />

            {total > 0 && (
                <div className="slot-tools">
                    <div className="slot-filters">
                        <div className="slot-sort">
                            <label htmlFor="slot-sort">Sortieren nach</label>
                            <select id="slot-sort" className="select" value={sort} onChange={handleSortChange}>
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="slot-sort">
                            <label htmlFor="slot-page-size">Bücher pro Seite</label>
                            <select
                                id="slot-page-size"
                                className="select"
                                value={pageSize}
                                onChange={handlePageSizeChange}
                            >
                                {PAGE_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="view-toggle" role="group" aria-label="Ansicht">
                        <button
                            type="button"
                            className="icon-btn"
                            aria-pressed={view === 'tiles'}
                            onClick={() => setView('tiles')}
                            title="Coveransicht"
                        >
                            <LayoutGrid size={17} aria-hidden="true" />
                            <span className="visually-hidden">Coveransicht</span>
                        </button>
                        <button
                            type="button"
                            className="icon-btn"
                            aria-pressed={view === 'list'}
                            onClick={() => setView('list')}
                            title="Kompakte Liste"
                        >
                            <List size={17} aria-hidden="true" />
                            <span className="visually-hidden">Kompakte Liste</span>
                        </button>
                    </div>
                </div>
            )}

            {books.error && (
                <div className="state-message state-error" role="alert">
                    <span>Die Bücher konnten nicht geladen werden: {books.error.message}</span>
                    <button type="button" className="btn btn-secondary" onClick={books.reload}>
                        Nochmals versuchen
                    </button>
                </div>
            )}

            {!list && !books.error && <p className="state-message">Bücher werden geladen …</p>}

            {list && list.total === 0 && (
                <div className="slot-empty">
                    <BookOpen size={23} aria-hidden="true" />
                    <p>Hier ist noch Platz für ein gutes Buch.</p>
                    <Link to={addLink} className="section-link">
                        Buch hier hinzufügen
                        <ChevronRight size={14} aria-hidden="true" />
                    </Link>
                </div>
            )}

            {pageMissing && (
                <div className="slot-empty">
                    <p>Diese Seite gibt es nicht mehr.</p>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handlePageChange(list.totalPages)}
                    >
                        Zur letzten Seite
                    </button>
                </div>
            )}

            {list && list.items.length > 0 && (
                <div className={books.loading ? 'slot-books is-loading' : 'slot-books'}>
                    {view === 'tiles' ? (
                        <ul className="book-grid">
                            {list.items.map((book) => (
                                <li key={book.id}>
                                    <BookTile book={book} from={from} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="book-list card">
                            {list.items.map((book) => (
                                <li key={book.id}>
                                    <BookRow book={book} from={from} />
                                </li>
                            ))}
                        </ul>
                    )}

                    <Pagination
                        page={page}
                        totalPages={list.totalPages}
                        onChange={handlePageChange}
                        summary={`${formatCount(list.from)}–${formatCount(list.to)} von ${formatCount(list.total)}`}
                    />
                </div>
            )}
        </div>
    )
}

// "Reihe 3 · 51 Bücher an diesem Ort". Tische haben nur eine "Ablage",
// dort zählt das ganze Möbel (siehe utils/location.js).
function leadText(header, total) {
    const count = plural(total, 'Buch', 'Bücher')
    if (header.label === 'Ablage') return `${count} an diesem Möbelstück`
    return `${header.label} · ${count} an diesem Ort`
}

function parseSort(value) {
    return SORT_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_SORT
}

function parsePage(value) {
    const page = Number(value)
    return Number.isInteger(page) && page > 0 ? page : 1
}