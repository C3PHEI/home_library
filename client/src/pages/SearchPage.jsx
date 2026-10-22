import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchBooks } from '../api/search.js'
import { useApi } from '../hooks/useApi.js'
import { plural } from '../utils/format.js'
import SearchForm from '../components/search/SearchForm.jsx'
import './SearchPage.css'

// Suche: /suche?q=süskin
// Die URL ist die "Wahrheit": Neuladen und Zurück-Taste zeigen dieselbe Suche.
export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()
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

    function handleSearch(nextQuery) {
        if (nextQuery === q) return
        // Neuer Eintrag im Verlauf, damit "Zurück" zur vorherigen Suche führt
        setSearchParams(nextQuery ? { q: nextQuery } : {})
    }

    return (
        <div className="page search-page">
            <div className="search-head">
                <h1 className="page-title">Buch suchen</h1>

                <SearchForm key={q} initialQuery={q} onSearch={handleSearch} />

                <p className="search-hint">Sucht in Titel, Autor und ISBN.</p>
            </div>

            <SearchStatus q={q} data={data} results={results} />

            {data && data.total > 0 && (
                <div className={results.loading ? 'search-results is-loading' : 'search-results'}>
                    {/* Etappe 6 ersetzt die einfache Liste durch Trefferkarten */}
                    {data.items.map((book) => (
                        <div key={book.id}>
                            {book.title} – {book.author} ({book.location.furnitureName}, {book.location.slotLabel})
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Alles, was über (oder statt) den Treffern steht. Genau ein Zustand ist sichtbar.
function SearchStatus({ q, data, results }) {
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

    // 5. Treffer
    return (
        <div className="search-summary" role="status">
            <span>{plural(data.total, 'Treffer', 'Treffer')}</span>
        </div>
    )
}