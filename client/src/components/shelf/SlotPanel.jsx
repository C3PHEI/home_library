import { useCallback, useEffect, useRef } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { getSlot, getSlotBooks } from '../../api/slots.js'
import { useApi } from '../../hooks/useApi.js'
import { MOBILE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery.js'
import { useStoredState } from '../../hooks/useStoredState.js'
import { formatCount, plural } from '../../utils/format.js'
import BookTile from '../books/BookTile.jsx'
import BookRow from '../books/BookRow.jsx'
import Pagination from '../Pagination.jsx'
import './SlotPanel.css'

const SORT_OPTIONS = [
    { value: 'title', label: 'Titel' },
    { value: 'author', label: 'Autor' },
    { value: 'year', label: 'Erscheinungsjahr' },
    { value: 'created', label: 'Erfassungsdatum' },
]
const DEFAULT_SORT = 'title'
const PAGE_SIZE = 12

// Bücherliste einer Reihe. Wird als Unterroute /regal/:slotId neben
// (bzw. auf dem Handy unter) der Regalübersicht angezeigt.
// Sortierung und Seite stehen in der URL (?sort=author&page=2).
export default function SlotPanel() {
    const slotId = Number(useParams().slotId)
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const sort = parseSort(searchParams.get('sort'))
    const page = parsePage(searchParams.get('page'))

    const isMobile = useMediaQuery(MOBILE_QUERY)
    const [storedView, setView] = useStoredState('bibliothek.reihe.ansicht', null)
    const view = storedView ?? (isMobile ? 'list' : 'tiles')

    const loadSlot = useCallback((options) => getSlot(slotId, options), [slotId])
    const loadBooks = useCallback(
        (options) => getSlotBooks(slotId, { sort, page, limit: PAGE_SIZE }, options),
        [slotId, sort, page],
    )
    const slot = useApi(loadSlot)
    const books = useApi(loadBooks)

    // Beim Wechsel der Reihe keine Daten der vorherigen Reihe zeigen
    const header = slot.data?.id === slotId ? slot.data : null
    const list = books.data?.slotId === slotId ? books.data : null

    // Nach Seiten- oder Sortierwechsel wieder oben in der Liste beginnen.
    // Desktop: die Liste scrollt im Panel. Handy: die ganze Seite scrollt.
    const panelRef = useRef(null)
    const bodyRef = useRef(null)
    const lastListKey = useRef(`${page}|${sort}`)
    useEffect(() => {
        const listKey = `${page}|${sort}`
        if (lastListKey.current === listKey) return // erster Aufruf (auch doppelt im StrictMode)
        lastListKey.current = listKey

        if (window.matchMedia(MOBILE_QUERY).matches) {
            panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        } else {
            bodyRef.current?.scrollTo({ top: 0 })
        }
    }, [page, sort])

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

    function handlePageChange(nextPage) {
        updateParams({ page: nextPage === 1 ? null : nextPage })
    }

    if (slot.error) {
        return (
            <section ref={panelRef} className="slot-panel" aria-label="Reihe">
                <div className="slot-panel-message">
                    <p className="state-error" role="alert">
                        {slot.error.status === 404 || slot.error.status === 400
                            ? 'Diese Reihe gibt es nicht.'
                            : `Die Reihe konnte nicht geladen werden: ${slot.error.message}`}
                    </p>
                    <div className="slot-panel-actions">
                        {slot.error.status !== 404 && slot.error.status !== 400 && (
                            <button type="button" className="btn btn-secondary" onClick={slot.reload}>
                                Nochmals versuchen
                            </button>
                        )}
                        <Link to="/" className="btn btn-secondary">Zur Regalübersicht</Link>
                    </div>
                </div>
            </section>
        )
    }

    const from = location.pathname + location.search
    const total = list?.total ?? header?.bookCount ?? 0
    const pageMissing = list && list.total > 0 && list.items.length === 0

    return (
        <section
            ref={panelRef}
            className="slot-panel"
            aria-labelledby="slot-panel-title"
            aria-busy={slot.loading || books.loading}
        >
            <div className="slot-panel-head">
                <div className="slot-panel-heading">
                    <div className="slot-panel-eyebrow">Standort</div>
                    <h2 id="slot-panel-title" className="slot-panel-title">
                        {header ? `${header.furniture.name}, ${header.label}` : 'Reihe wird geladen …'}
                    </h2>
                    {header && (
                        <p className="slot-panel-sub">
                            {header.room ? `${header.room}, ` : ''}
                            {plural(total, 'Buch', 'Bücher')}
                        </p>
                    )}
                </div>

                <div className="slot-panel-tools">
                    <div className="view-toggle" role="group" aria-label="Ansicht">
                        <button
                            type="button"
                            className="view-toggle-btn"
                            aria-pressed={view === 'list'}
                            onClick={() => setView('list')}
                        >
                            Liste
                        </button>
                        <button
                            type="button"
                            className="view-toggle-btn"
                            aria-pressed={view === 'tiles'}
                            onClick={() => setView('tiles')}
                        >
                            Kacheln
                        </button>
                    </div>
                    <Link to="/" className="slot-panel-close" aria-label="Reihe schliessen" title="Schliessen">
                        <CloseIcon />
                    </Link>
                </div>
            </div>

            {total > 0 && (
                <div className="slot-panel-toolbar">
                    <div className="slot-panel-sort">
                        <label htmlFor="slot-sort">Sortieren</label>
                        <select id="slot-sort" className="select" value={sort} onChange={handleSortChange}>
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {list && list.items.length > 0 && (
                        <span className="slot-panel-range">
                            {formatCount(list.from)} bis {formatCount(list.to)} von {formatCount(list.total)}
                        </span>
                    )}
                </div>
            )}

            <div ref={bodyRef} className="slot-panel-body">
                {books.error && (
                    <div className="state-message state-error" role="alert">
                        <span>Die Bücher konnten nicht geladen werden: {books.error.message}</span>
                        <button type="button" className="btn btn-secondary" onClick={books.reload}>
                            Nochmals versuchen
                        </button>
                    </div>
                )}

                {!list && !books.error && <p className="slot-panel-hint">Bücher werden geladen …</p>}

                {list && list.total === 0 && (
                    <div className="slot-panel-empty">
                        <p>In dieser Reihe stehen noch keine Bücher.</p>
                        <Link to={`/erfassen?slot=${slotId}`} className="btn btn-primary">
                            Buch hier erfassen
                        </Link>
                    </div>
                )}

                {pageMissing && (
                    <div className="slot-panel-empty">
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
                    <div className={books.loading ? 'slot-panel-books is-loading' : 'slot-panel-books'}>
                        {view === 'tiles' ? (
                            <ul className="book-grid">
                                {list.items.map((book) => (
                                    <li key={book.id}>
                                        <BookTile book={book} from={from} />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <ul className="book-list">
                                {list.items.map((book) => (
                                    <li key={book.id}>
                                        <BookRow book={book} from={from} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {list && list.totalPages > 1 && !pageMissing && (
                <div className="slot-panel-foot">
                    <Pagination page={page} totalPages={list.totalPages} onChange={handlePageChange} />
                </div>
            )}
        </section>
    )
}

function parseSort(value) {
    return SORT_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_SORT
}

function parsePage(value) {
    const page = Number(value)
    return Number.isInteger(page) && page > 0 ? page : 1
}

function CloseIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    )
}