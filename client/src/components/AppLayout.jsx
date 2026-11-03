import { Link, Outlet, useLocation } from 'react-router-dom'
import { House, Library, Plus, Search } from 'lucide-react'
import './AppLayout.css'
import buch from '../assets/buch.png'

// Hauptnavigation. match: wann der Eintrag als aktiv gilt.
const NAV_ITEMS = [
    {
        to: '/',
        label: 'Übersicht',
        icon: House,
        // Bleibt aktiv, wenn ein Fach geöffnet ist (/regal/12)
        match: (path) => path === '/' || path.startsWith('/regal'),
    },
    {
        to: '/suche',
        label: 'Buch finden',
        icon: Search,
        match: (path) => path.startsWith('/suche'),
    },
    {
        to: '/buecher',
        label: 'Alle Bücher',
        icon: Library,
        match: (path) => path.startsWith('/buecher'),
    },
    {
        to: '/erfassen',
        label: 'Buch hinzufügen',
        icon: Plus,
        // Auch "ohne ISBN" (/erfassen/ohne-isbn)
        match: (path) => path.startsWith('/erfassen'),
    },
]

// Gerüst wie im neuen Mock: Seitenleiste links, auf dem Handy als Leiste unten.
export default function AppLayout() {
    return (
        <div className="app-shell">
            <Sidebar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    )
}

function Sidebar() {
    const { pathname } = useLocation()

    return (
        <aside className="sidebar">
            <Link to="/" className="brand">
                <span className="brand-mark" aria-hidden="true">
                    <img className="brand-logo" src={buch} alt="" />
                </span>
                <span className="brand-text">
                    <span className="brand-name">Bibliothek</span>
                    <span className="brand-sub">Unser Zuhause in Büchern</span>
                </span>
            </Link>

            <div className="nav-caption" id="nav-caption">
                Meine Sammlung
            </div>

            <nav className="nav-list" aria-labelledby="nav-caption">
                {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => {
                    // Aktiv-Zustand selbst berechnen, damit auch Unterseiten zählen
                    const active = match(pathname)
                    return (
                        <Link
                            key={to}
                            to={to}
                            className={active ? 'nav-link is-active' : 'nav-link'}
                            aria-current={active ? 'page' : undefined}
                        >
                            <Icon size={18} aria-hidden="true" />
                            <span className="nav-label">{label}</span>
                        </Link>
                    )
                })}
            </nav>

            <p className="side-foot">
                <strong>WEBSITE CREATED BY</strong>
                <br />
                Maximilian Läpple
            </p>
        </aside>
    )
}