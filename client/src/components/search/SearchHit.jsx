import { Link } from 'react-router-dom'
import BookCover from '../books/BookCover.jsx'
import { placeLabel } from '../../utils/location.js'
import './SearchHit.css'

// Ein Suchtreffer: Cover, Titel, Autor, ISBN und rechts der Standort.
// Die ganze Karte führt zur Buchdetailseite. from = Adresse für den Rückweg.
export default function SearchHit({ book, from }) {
    const { location } = book

    return (
        <Link to={`/buecher/${book.id}`} state={{ from }} className="search-hit">
            <BookCover src={book.coverThumbUrl} variant="hit" />

            <span className="search-hit-text">
                <span className="search-hit-title">{book.title}</span>
                <span className="search-hit-author">{book.author}</span>
                <span className="search-hit-isbn">{book.isbn13 ?? 'keine ISBN erfasst'}</span>
                {book.loanedTo && <span className="book-loaned">Verliehen an {book.loanedTo}</span>}
            </span>

            <span className="search-hit-location">
                <PinIcon />
                <span className="search-hit-location-text">
                    <span className="search-hit-place">{placeLabel(location)}</span>
                    {location.room && <span className="search-hit-room">{location.room}</span>}
                </span>
            </span>
        </Link>
    )
}

function PinIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    )
}