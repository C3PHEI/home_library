import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { searchBooks } from '../api/search.js'
import { useApi } from '../hooks/useApi.js'
import { formatCount, plural } from '../utils/format.js'
import SearchForm from '../components/search/SearchForm.jsx'
import SearchHit from '../components/search/SearchHit.jsx'
import SearchNote from '../components/search/SearchNote.jsx'
import DuplicateNote from '../components/search/DuplicateNote.jsx'
import { findDuplicateGroups } from '../components/search/duplicates.js'
import SearchTabs from '../components/search/SearchTabs.jsx'
import { hasUsefulTabs, tabLabel, visibleTabs } from '../components/search/searchTabUtils.js'
import './SearchPage.css'

// Suche: /suche?q=süskin&tab=author
// Die URL ist die "Wahrheit": Neuladen und Zurück-Taste zeigen dieselbe Suche.
export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const q = (searchParams.get('q') ?? '').trim()

    // Neuer loader, sobald sich q ändert -> useApi lädt neu.
    // Leeres q: kein Request, sonst antwortet das Backend mit 400 "Suchbegriff fehlt".
    const loadResults = useCallback(
        (options) => (q ? searchBooks(q, options) : Promise.resolve(null)),
        [q],
    )
    const results = useApi(loadResults)

    // Gehört die Antwort noch zu einer früheren Suche, nicht anzeigen
    const data = results.data?.query === q ? results.data : null

    // Tabs: nur die mit Treffern. Unbekannter oder leerer Tab in der URL -> "Alle"
    const tabs = data ? visibleTabs(data.tabs) : []
    const requestedTab = searchParams.get('tab') ?? 'all'
    const activeTab = tabs.some((tab) => tab.key === requestedTab) ? requestedTab : 'all'
    const showTabs = data && hasUsefulTabs(tabs, data.total)

    // Gefiltert wird hier: jeder Treffer weiss in "matches", zu welchen Tabs er gehört
    const items = !data
        ? []
        : activeTab === 'all'
            ? data.items
            : data.items.filter((book) => book.matches.includes(activeTab))

    // Doppelte Exemplare unter den sichtbaren Treffern (Hinweis unter der Liste)
    const duplicateGroups = findDuplicateGroups(items)

    // Rückweg für die Buchdetailseite: genau diese Suche (inkl. Tab)
    const from = location.pathname + location.search

    function handleSearch(nextQuery) {
        if (nextQuery === q) return
        // Neue Suche beginnt immer bei "Alle". Neuer Eintrag im Verlauf,
        // damit "Zurück" zur vorherigen Suche führt.
        setSearchParams(nextQuery ? { q: nextQuery } : {})
    }

    function handleTabChange(tab) {
        // Tabwechsel ersetzt den Verlaufseintrag: "Zurück" springt zur vorherigen Suche,
        // nicht durch jeden angeklickten Tab
        setSearchParams(tab === 'all' ? { q } : { q, tab }, { replace: true })
    }

    return (
        <div className="page search-page">
            <div className="search-head">
                <h1 className="page-title">Buch suchen</h1>

                <SearchForm key={q} initialQuery={q} onSearch={handleSearch} />

                <p className="search-hint">
                    Sucht in Titel, Autor, ISBN, Verlag, Erscheinungsjahr, Sprache und Standort.
                    Tippfehler bei Titel und Autor sind verziehen.
                </p>
            </div>

            {showTabs && <SearchTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />}

            <SearchStatus q={q} data={data} results={results} visibleCount={items.length} activeTab={activeTab} />

            {items.length > 0 && (
                <ul className={results.loading ? 'search-results is-loading' : 'search-results'}>
                    {items.map((book) => (
                        <li key={book.id}>
                            <SearchHit book={book} from={from} />
                        </li>
                    ))}
                </ul>
            )}

            <DuplicateNote groups={duplicateGroups} />
        </div>
    )
}

// Alles, was über (oder statt) den Treffern steht. Genau ein Zustand ist sichtbar.
function SearchStatus({ q, data, results, visibleCount, activeTab }) {
    // 1. Noch kein Suchbegriff
    if (!q) {
        return <p className="state-message">Titel, Autor oder ISBN eingeben und auf „Suchen“ klicken.</p>
    }

    // 2. Fehler
    if (results.error) {
        const error = results.error
        // 400: Eingabe ungültig (z. B. zu lang). Nochmals versuchen bringt nichts.
        if (error.status === 400) {
            return (
                <div className="state-message state-error" role="alert">
                    <span>Ungültiger Suchbegriff: {error.fields?.q ?? error.message}</span>
                </div>
            )
        }
        return (
            <div className="state-message state-error" role="alert">
                <span>Die Suche hat nicht geklappt: {error.message}</span>
                <button type="button" className="btn btn-secondary" onClick={results.reload}>
                    Nochmals versuchen
                </button>
            </div>
        )
    }

    // 3. Lädt (erste Antwort für diesen Begriff steht noch aus)
    if (!data) {
        return (
            <p className="state-message" role="status">
                Suche läuft …
            </p>
        )
    }

    // 4. Nichts gefunden
    if (data.total === 0) {
        return (
            <div className="search-empty" role="status">
                <p className="search-empty-title">Nichts gefunden für „{q}“.</p>
                <p className="search-empty-tip">
                    Tipp: Weniger Wörter versuchen, nur den Nachnamen des Autors oder die ISBN ohne Bindestriche.
                </p>
            </div>
        )
    }

    // 5. Treffer ("Alle" oder gefiltert)
    // fuzzy: keine genauen Treffer, die Liste kommt aus der Tippfehler-Suche (pg_trgm)
    const fuzzy = isFuzzy(data)

    return (
        <>
            <div className="search-summary" role="status">
                <span>
                    {activeTab === 'all'
                        ? plural(data.total, 'Treffer', 'Treffer')
                        : `${formatCount(visibleCount)} von ${plural(data.total, 'Treffer', 'Treffern')} in ${tabLabel(activeTab)}`}
                </span>
                <span>{fuzzy ? 'Sortiert nach Ähnlichkeit' : 'Sortiert nach Titel'}</span>
            </div>

            {fuzzy && (
                <SearchNote>
                    <strong>Keine genauen Treffer für „{q}“.</strong> Das sind ähnliche Titel und Autoren,
                    die ähnlichsten zuerst. Vielleicht ist ein Tippfehler im Suchbegriff.
                </SearchNote>
            )}
        </>
    )
}

// Das Backend markiert den Tab "Alle" mit fuzzy: true, wenn die Tippfehler-Suche lief
function isFuzzy(data) {
    return data.tabs.some((tab) => tab.key === 'all' && tab.fuzzy)
}