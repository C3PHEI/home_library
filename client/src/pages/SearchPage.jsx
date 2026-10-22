import { useSearchParams } from 'react-router-dom'
import SearchForm from '../components/search/SearchForm.jsx'
import './SearchPage.css'

// Suche: /suche?q=süskin
// Die URL ist die "Wahrheit": Neuladen und Zurück-Taste zeigen dieselbe Suche.
export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const q = (searchParams.get('q') ?? '').trim()

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

            <div className="search-results">
            </div>
        </div>
    )
}