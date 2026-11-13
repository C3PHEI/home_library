import { useCallback, useEffect, useRef } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { BookOpen, Download, Plus, RotateCcw } from 'lucide-react'
import { BOOKS_CSV_URL, getBookFilters, getBooks } from '../api/books.js'
import { useApi } from '../hooks/useApi.js'
import { formatCount, plural } from '../utils/format.js'
import { useStoredState } from '../hooks/useStoredState.js'
import PageHead from '../components/PageHead.jsx'
import BookTable from '../components/books/BookTable.jsx'
import Pagination from '../components/Pagination.jsx'
import './AllBooksPage.css'

// Sortierung wie im neuen Mock: Titel und Autor von A bis Z, Jahr und "Hinzugefügt" das Neuste zuerst
const SORT_OPTIONS = [
    { value: 'title', label: 'Titel', dir: 'asc' },
    { value: 'author', label: 'Autor', dir: 'asc' },
    { value: 'year', label: 'Jahr', dir: 'desc' },
]
const DEFAULT_SORT = 'title'
// Bücher pro Seite. Das Backend liefert höchstens 100 auf einmal.
const PAGE_SIZES = [10, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 25
const PAGE_SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: size, label: String(size) }))

// Nur um zu wissen, wie viele Bücher es insgesamt gibt (ohne Filter)
const loadTotal = (options) => getBooks({ limit: 1 }, options)

// Alle Bücher: /buecher
// Sortierung, Filter und Seite stehen in der URL (?sort=author&language=de&page=2):
// Neuladen und Zurück-Taste zeigen dieselbe Liste.
export default function AllBooksPage() {
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const sort = parseSort(searchParams.get('sort'))
    const dir = parseDir(searchParams.get('dir'), sort)
    const page = parsePage(searchParams.get('page'))
    const language = searchParams.get('language') ?? ''
    const author = searchParams.get('author') ?? ''
    const year = searchParams.get('year') ?? ''
    const filtered = Boolean(language || author || year)
    const [storedPageSize, setPageSize] = useStoredState('bibliothek.buecher.proSeite', DEFAULT_PAGE_SIZE)
    const pageSize = PAGE_SIZES.includes(storedPageSize) ? storedPageSize : DEFAULT_PAGE_SIZE

    const loadBooks = useCallback(
        (options) => getBooks({ sort, dir, page, limit: pageSize, language, author, year }, options),
        [sort, dir, page, pageSize, language, author, year],
    )

    const books = useApi(loadBooks)
    const filters = useApi(getBookFilters)
    const totals = useApi(loadTotal)

    const list = books.data
    const totalAll = totals.data?.total ?? null

    // Nach Seiten-, Sortier- oder Filterwechsel wieder oben beginnen
    const listKey = `${page}|${sort}|${dir}|${pageSize}|${language}|${author}|${year}`
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
                    if (value === null || value === '') next.delete(key)
                    else next.set(key, String(value))
                }
                return next
            },
            { replace: true },
        )
    }

    // Andere Seitengrösse: wieder bei Seite 1 beginnen
    function handlePageSizeChange(event) {
        setPageSize(Number(event.target.value))
        updateParams({ page: null })
    }

    // Die Richtung steht nur in der URL, wenn sie vom Normalfall der Spalte abweicht
    function applySort(nextSort, nextDir) {
        updateParams({
            sort: nextSort === DEFAULT_SORT ? null : nextSort,
            dir: nextDir === defaultDir(nextSort) ? null : nextDir,
            page: null,
        })
    }

    // Dropdown: immer mit der üblichen Richtung der Spalte beginnen
    function handleSortChange(event) {
        const value = event.target.value
        applySort(value, defaultDir(value))
    }

    // Klick auf einen Spaltenkopf: gleiche Spalte dreht die Richtung um,
    // eine andere Spalte beginnt mit ihrer üblichen Richtung
    function handleColumnSort(column) {
        if (column === sort) applySort(column, dir === 'asc' ? 'desc' : 'asc')
        else applySort(column, defaultDir(column))
    }

    // Neuer Filter: wieder bei Seite 1 beginnen
    function handleFilterChange(name, value) {
        updateParams({ [name]: value, page: null })
    }

    function handleReset() {
        updateParams({ language: null, author: null, year: null, page: null })
    }

    function handlePageChange(nextPage) {
        updateParams({ page: nextPage === 1 ? null : nextPage })
    }

    // Rückweg für die Buchdetailseite: genau diese Liste
    const from = location.pathname + location.search
    const pageMissing = list && list.total > 0 && list.items.length === 0

    return (
        <div className="page all-books-page" aria-busy={books.loading}>
            <PageHead
                eyebrow="Das ganze Bücherregal"
                title="Alle Bücher"
                lead={
                    totalAll === null
                        ? 'Liebevoll an einem Ort gesammelt.'
                        : `${plural(totalAll, 'Buch', 'Bücher')} – liebevoll an einem Ort gesammelt.`
                }
                actions={
                    <a href={BOOKS_CSV_URL} download className="btn btn-secondary">
                        <Download size={16} aria-hidden="true" />
                        CSV herunterladen
                    </a>
                }
            />

            <div className="card all-books-card">
                <div className="all-books-tools">
                    <FilterSelect
                        id="books-sort"
                        label="Sortieren nach"
                        value={sort}
                        onChange={handleSortChange}
                        options={SORT_OPTIONS}
                    />
                    <FilterSelect
                        id="books-language"
                        label="Sprache"
                        value={language}
                        onChange={(event) => handleFilterChange('language', event.target.value)}
                        allLabel="Alle Sprachen"
                        options={filterOptions(filters.data?.languages, language)}
                    />
                    <FilterSelect
                        id="books-author"
                        label="Autorin / Autor"
                        value={author}
                        onChange={(event) => handleFilterChange('author', event.target.value)}
                        allLabel="Alle Autoren"
                        options={filterOptions(filters.data?.authors, author)}
                    />
                    <FilterSelect
                        id="books-year"
                        label="Jahr"
                        value={year}
                        onChange={(event) => handleFilterChange('year', event.target.value)}
                        allLabel="Alle Jahre"
                        options={filterOptions(filters.data?.years, year)}
                    />
                    <FilterSelect
                        id="books-page-size"
                        label="Bücher pro Seite"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        options={PAGE_SIZE_OPTIONS}
                    />

                    <div className="all-books-tools-end">
                        {list && (
                            <span className="all-books-count" role="status">
                                {filtered
                                    ? `${formatCount(list.total)} von ${plural(totalAll ?? list.total, 'Buch', 'Büchern')}`
                                    : plural(list.total, 'Buch', 'Bücher')}
                            </span>
                        )}
                        <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={handleReset}
                            disabled={!filtered}
                        >
                            <RotateCcw size={14} aria-hidden="true" />
                            Filter zurücksetzen
                        </button>
                    </div>
                </div>

                {filters.error && (
                    <p className="all-books-hint" role="alert">
                        Die Filter konnten nicht geladen werden: {filters.error.message}
                    </p>
                )}

                {books.error && <ListError error={books.error} onRetry={books.reload} onReset={handleReset} />}

                {!list && !books.error && <p className="state-message">Bücher werden geladen …</p>}

                {list && list.total === 0 && (
                    <div className="all-books-empty">
                        <BookOpen size={25} aria-hidden="true" />
                        {filtered ? (
                            <>
                                <h2>Nichts gefunden</h2>
                                <p>Zu diesen Filtern gibt es kein Buch. Ändere die Auswahl oder setze sie zurück.</p>
                                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                                    <RotateCcw size={16} aria-hidden="true" />
                                    Filter zurücksetzen
                                </button>
                            </>
                        ) : (
                            <>
                                <h2>Noch keine Bücher</h2>
                                <p>Sobald das erste Buch hinzugefügt ist, steht es hier.</p>
                                <Link to="/erfassen" className="btn btn-primary">
                                    <Plus size={16} aria-hidden="true" />
                                    Buch hinzufügen
                                </Link>
                            </>
                        )}
                    </div>
                )}

                {pageMissing && (
                    <div className="all-books-empty">
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
                    <div className={books.loading ? 'all-books-list is-loading' : 'all-books-list'}>
                        <BookTable books={list.items} from={from} sort={sort} dir={dir} onSort={handleColumnSort} />

                        <Pagination
                            page={page}
                            totalPages={list.totalPages}
                            onChange={handlePageChange}
                            summary={`${formatCount(list.from)}–${formatCount(list.to)} von ${formatCount(list.total)}`}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

// Beschriftetes Dropdown in der Werkzeugleiste.
// allLabel: erster Eintrag ohne Filter ("Alle Sprachen"), fehlt bei der Sortierung
function FilterSelect({ id, label, value, onChange, options, allLabel }) {
    return (
        <div className="all-books-filter">
            <label htmlFor={id}>{label}</label>
            <select id={id} className="select" value={value} onChange={onChange}>
                {allLabel && <option value="">{allLabel}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

function ListError({ error, onRetry, onReset }) {
    // 400: ein Filter aus der Adresse ist ungültig (z. B. ?year=abc). Nochmals laden bringt nichts.
    if (error.status === 400) {
        return (
            <div className="state-message state-error" role="alert">
                <span>Dieser Filter ist ungültig: {Object.values(error.fields ?? {})[0] ?? error.message}</span>
                <button type="button" className="btn btn-secondary" onClick={onReset}>
                    Filter zurücksetzen
                </button>
            </div>
        )
    }
    return (
        <div className="state-message state-error" role="alert">
            <span>Die Bücher konnten nicht geladen werden: {error.message}</span>
            <button type="button" className="btn btn-secondary" onClick={onRetry}>
                Nochmals versuchen
            </button>
        </div>
    )
}

// Einträge aus GET /api/books/filters -> Optionen: "Deutsch (812)".
// Ein Wert aus der Adresse, den es in der Liste nicht (mehr) gibt, bleibt wählbar,
// sonst würde das Dropdown etwas anderes zeigen als gefiltert wird.
function filterOptions(entries, selected) {
    const options = (entries ?? []).map((entry) => ({
        value: String(entry.value),
        label: `${entry.label ?? entry.value} (${formatCount(entry.count)})`,
    }))
    if (selected && !options.some((option) => option.value === selected)) {
        options.unshift({ value: selected, label: selected })
    }
    return options
}

function parseSort(value) {
    return SORT_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_SORT
}

function defaultDir(sort) {
    return SORT_OPTIONS.find((option) => option.value === sort).dir
}

// ?dir=desc -> 'desc', fehlt oder ungültig -> übliche Richtung der Spalte
function parseDir(value, sort) {
    return value === 'asc' || value === 'desc' ? value : defaultDir(sort)
}

function parsePage(value) {
    const page = Number(value)
    return Number.isInteger(page) && page > 0 ? page : 1
}