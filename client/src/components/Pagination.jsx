import './Pagination.css'

export default function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null

    return (
        <nav className="pagination" aria-label="Seiten">
            <button
                type="button"
                className="btn btn-secondary pagination-btn"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
            >
                Zurück
            </button>
            <span className="pagination-status" aria-live="polite">
                Seite {page} von {totalPages}
            </span>
            <button
                type="button"
                className="btn btn-secondary pagination-btn"
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
            >
                Weiter
            </button>
        </nav>
    )
}