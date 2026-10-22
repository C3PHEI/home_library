import { useState } from 'react'
import './SearchForm.css'

// Grosses Suchfeld auf der Suchseite.
// initialQuery kommt aus der URL. Die Seite gibt dem Formular key={q}:
// ändert sich q (z. B. Zurück-Taste), startet das Formular mit dem neuen Wert neu.
export default function SearchForm({ initialQuery, onSearch }) {
    const [query, setQuery] = useState(initialQuery)

    function handleSubmit(event) {
        event.preventDefault()
        onSearch(query.trim())
    }

    return (
        <form className="search-page-form" role="search" onSubmit={handleSubmit}>
            <label htmlFor="search-page-input" className="visually-hidden">
                Titel, Autor oder ISBN suchen
            </label>
            <input
                id="search-page-input"
                type="search"
                className="input search-page-input"
                placeholder="Titel, Autor oder ISBN"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus={initialQuery === ''}
                autoComplete="off"
                enterKeyHint="search"
            />
            <button type="submit" className="btn btn-primary search-page-button">
                Suchen
            </button>
        </form>
    )
}