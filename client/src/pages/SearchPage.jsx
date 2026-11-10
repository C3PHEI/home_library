import { useCallback } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Plus, Search, SearchCheck } from 'lucide-react'
import { searchBooks } from '../api/search.js'
import { useApi } from '../hooks/useApi.js'
import { formatCount, plural } from '../utils/format.js'
import PageHead from '../components/PageHead.jsx'
import SearchForm from '../components/search/SearchForm.jsx'
import SearchHit from '../components/search/SearchHit.jsx'
import SearchNote from '../components/search/SearchNote.jsx'
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

    // Rückweg für die Buchdetailseite: genau diese Suche (inkl. Tab)
    const from = location.pathname + location.search

    function handleSearch(nextQuery) {
        if (nextQuery === q) return
        // Neue Suche beginnt immer bei "Alle". Gesucht wird schon beim Tippen,
        // darum den Verlaufseintrag ersetzen: "Zurück" verlässt die Suche,
        // statt durch jeden getippten Buchstaben zu springen.
        setSearchParams(nextQuery ? { q: nextQuery } : {}, { replace: true })
    }

    function handleTabChange(tab) {
        setSearchParams(tab === 'all' ? { q } : { q, tab }, { replace: true })
    }

    return (
        <div className="page search-page">
            <PageHead
                eyebrow="Schnell nachschlagen"
                title="Wo ist dieses Buch?"
                lead="Titel, Autor oder ISBN eingeben – wir suchen in deinem Zuhause."
            />

            <div className="search-controls">
                <SearchForm query={q} onSearch={handleSearch} />
                {showTabs && <SearchTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />}
            </div>

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
        </div>
    )
}

// Alles, was über (oder statt) den Treffern steht. Genau ein Zustand ist sichtbar.
function SearchStatus({ q, data, results, visibleCount, activeTab }) {
    // 1. Noch kein Suchbegriff
    if (!q) {
        return (
            <div className="search-start">
                <Search size={23} aria-hidden="true" />
                <p className="search-start-title">Einfach oben lostippen.</p>
                <p>
                    Gesucht wird in Titel, Autor, ISBN, Verlag, Erscheinungsjahr, Sprache und Standort.
                    Tippfehler bei Titel und Autor sind verziehen.
                </p>
            </div>
        )
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
            <div className="card search-empty" role="status">
                <SearchCheck size={28} aria-hidden="true" />
                <h2 className="search-empty-title">Hier steht dieses Buch noch nicht</h2>
                <p className="search-empty-text">
                    Für „{q}“ gibt es keinen Treffer. Prüfe die Schreibweise, versuche nur den Nachnamen
                    des Autors oder die ISBN ohne Bindestriche. Oder füge das Buch gleich hinzu.
                </p>
                <Link to="/erfassen" className="btn btn-primary">
                    <Plus size={16} aria-hidden="true" />
                    Buch hinzufügen
                </Link>
            </div>
        )
    }

    // 5. Treffer ("Alle" oder gefiltert)
    // fuzzy: keine genauen Treffer, die Liste kommt aus der Tippfehler-Suche (pg_trgm)
    const fuzzy = isFuzzy(data)

    return (
        <>
            <div className="search-summary" role="status">
                <h2>
                    {activeTab === 'all'
                        ? `${plural(data.total, 'Treffer', 'Treffer')} gefunden`
                        : `${formatCount(visibleCount)} von ${plural(data.total, 'Treffer', 'Treffern')} in ${tabLabel(activeTab)}`}
                </h2>
                <span className="search-summary-sort">
                    {fuzzy ? 'Sortiert nach Ähnlichkeit' : 'Sortiert nach Titel'}
                </span>
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