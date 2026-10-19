import { Link } from 'react-router-dom'

// Platzhalter, bis die Seite gebaut ist
export default function PlaceholderPage({ title }) {
    return (
        <div className="page">
            <h1 className="page-title">{title}</h1>
            <p>
                <span className="page-lead">Coming soon!</span>{" "}
                <span className="page-back">
                    <Link to="/">← Go back</Link>
                </span>
            </p>
        </div>
    )
}