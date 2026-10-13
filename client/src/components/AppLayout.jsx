import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import './AppLayout.css'

export default function AppLayout() {
    return (
        <div className="app">
            <AppHeader />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    )
}

function AppHeader() {
    const { pathname } = useLocation()
    // "Regal" bleibt aktiv, auch wenn eine Reihe geoeffnet ist
    const shelfActive = pathname === '/' || pathname.startsWith('/regal')

    return (
        <header className="app-header">
            <Link to="/" className="brand">
                <span className="brand-title">Bibliothek</span>
                <span className="brand-subtitle">Buchsammlung zuhause</span>
            </Link>

            <nav className="main-nav" aria-label="Hauptnavigation">
                <NavLink to="/" className={() => navClass(shelfActive)}>
                    Regal
                </NavLink>
                <NavLink to="/buecher" className={({ isActive }) => navClass(isActive)}>
                    Alle Bücher
                </NavLink>
            </nav>

            <SearchForm />

            <Link to="/erfassen" className="btn btn-primary">
                Buch erfassen
            </Link>
        </header>
    )
}

function navClass(active) {
    return active ? 'nav-link is-active' : 'nav-link'
}

function SearchForm() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    // Auf der Suchseite steht der Suchbegriff schon in der URL (?q=...)
    const [query, setQuery] = useState(searchParams.get('q') ?? '')

    function handleSubmit(event) {
        event.preventDefault()
        const q = query.trim()
        if (!q) return
        navigate(`/suche?q=${encodeURIComponent(q)}`)
    }

    return (
        <form className="search-form" role="search" onSubmit={handleSubmit}>
            <label htmlFor="global-search" className="visually-hidden">
                Titel, Autor oder ISBN suchen
            </label>
            <input
                id="global-search"
                type="search"
                className="input"
                placeholder="Titel, Autor oder ISBN"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </form>
    )
}