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

            {/* Etappe 5 ersetzt diesen Teil durch alle Zustände (lädt, Fehler, nichts gefunden …) */}
            {data && (
                <div className="search-summary">
                    <span>{plural(data.total, 'Treffer', 'Treffer')}</span>
                </div>
            )}

            <div className="search-results">
                {/* Etappe 6 ersetzt die einfache Liste durch Trefferkarten */}
                {data?.items.map((book) => (
                    <div key={book.id}>
                        {book.title} – {book.author} ({book.location.furnitureName}, {book.location.slotLabel})
                    </div>
                ))}
            </div>
        </div>
    )
}