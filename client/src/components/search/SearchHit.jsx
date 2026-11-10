import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import BookCover from '../books/BookCover.jsx'
import { placeLabel } from '../../utils/location.js'
import './SearchHit.css'

// Ein Suchtreffer als Karte: Cover, Titel, Autor, Jahr, ISBN und der Standort.
// Die ganze Karte führt zur Buchdetailseite (der Titel-Link ist über die Karte
// gespannt), der Standort führt zum Fach. from = Adresse für den Rückweg.
export default function SearchHit({ book, from }) {
    const { location } = book

    return (
        <article className="card search-hit">
            <BookCover src={book.coverThumbUrl} variant="hit" />

            <div className="search-hit-main">
                <Link to={`/buecher/${book.id}`} state={{ from }} className="search-hit-title">
                    {book.title}
                </Link>
                <div className="search-hit-author">{book.author}</div>
                <div className="search-hit-meta">
                    {book.publishedYear && <span>{book.publishedYear}</span>}
                    <span>{book.isbn13 ? `ISBN ${book.isbn13}` : 'keine ISBN erfasst'}</span>
                </div>
                <Link to={`/regal/${location.slotId}`} className="search-hit-location">
                    <MapPin size={13} aria-hidden="true" />
                    <span>
                        {placeLabel(location)}
                        {location.room && <span className="search-hit-room"> · {location.room}</span>}
                    </span>
                </Link>
            </div>

            <span className="icon-btn search-hit-open" aria-hidden="true">
                <ChevronRight size={18} />
            </span>
        </article>
    )
}