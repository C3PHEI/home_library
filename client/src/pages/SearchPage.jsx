import './SearchPage.css'

// Suche: /suche?q=süskin
export default function SearchPage() {
    return (
        <div className="page search-page">
            <div className="search-head">
                <h1 className="page-title">Buch suchen</h1>

                <p className="search-hint">Sucht in Titel, Autor und ISBN.</p>
            </div>

            <div className="search-results">
            </div>
        </div>
    )
}