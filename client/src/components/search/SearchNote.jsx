import './SearchNote.css'

// Hinweisbox mit Info-Symbol (wie unten in Suche.html).
// Wird für die Tippfehler-Suche gebraucht und in Etappe 9 für doppelte Exemplare.
export default function SearchNote({ children }) {
    return (
        <div className="search-note">
            <InfoIcon />
            <span className="search-note-text">{children}</span>
        </div>
    )
}

function InfoIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
        </svg>
    )
}