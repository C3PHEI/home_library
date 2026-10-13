import { Link } from 'react-router-dom'

// Platzhalter, bis die Seite gebaut ist
export default function PlaceholderPage({ title }) {
    return (
        <div className="page">
            <h1 className="page-title">{title}</h1>
            <p className="page-lead">
                Diese Seite folgt noch. <Link to="/">Zur Regalübersicht</Link>
            </p>
        </div>
    )
}