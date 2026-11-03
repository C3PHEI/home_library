import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Pagination.css'

// Blättern wie im neuen Mock: links "1–12 von 51", rechts  ‹  1 / 5  ›
// summary: Text links (optional)
export default function Pagination({ page, totalPages, onChange, summary }) {
    return (
        <nav className="pagination" aria-label="Seiten">
            <span className="pagination-summary">{summary}</span>

            <div className="pagination-actions">
                <button
                    type="button"
                    className="icon-btn"
                    disabled={page <= 1}
                    onClick={() => onChange(page - 1)}
                    aria-label="Vorherige Seite"
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <span className="pagination-status" aria-live="polite">
                    <span className="visually-hidden">Seite </span>
                    {page} / {totalPages}
                </span>
                <button
                    type="button"
                    className="icon-btn"
                    disabled={page >= totalPages}
                    onClick={() => onChange(page + 1)}
                    aria-label="Nächste Seite"
                >
                    <ChevronRight size={16} aria-hidden="true" />
                </button>
            </div>
        </nav>
    )
}