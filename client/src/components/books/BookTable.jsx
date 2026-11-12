import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import BookCover from './BookCover.jsx'
import { placeLabel } from '../../utils/location.js'
import './BookTable.css'

// Bücherliste wie im neuen Mock (.book-table): Titel, Autor, Jahr, Standort.
// PC und iPad quer: Spalten nebeneinander mit Kopfzeile.
// iPad hochkant und Handy: jede Zeile wird zu drei kurzen Zeilen neben dem Cover.
// Die ganze Zeile führt zum Buch, der Standort zum Fach. from = Adresse für den Rückweg.
export default function BookTable({ books, from }) {
    return (
        <div className="book-table">
            <div className="book-table-head" aria-hidden="true">
                <span>Titel</span>
                <span>Autorin / Autor</span>
                <span>Jahr</span>
                <span>Standort</span>
                <span />
            </div>

            <ul className="book-table-rows">
                {books.map((book) => (
                    <li key={book.id} className="book-table-row">
                        <BookCover src={book.coverThumbUrl} variant="row" />

                        <Link to={`/buecher/${book.id}`} state={{ from }} className="book-table-title">
                            {book.title}
                        </Link>

                        <span className="book-table-author">{book.author}</span>

                        <span className={book.publishedYear ? 'book-table-year' : 'book-table-year is-empty'}>
                            {book.publishedYear ?? '–'}
                        </span>

                        <Link to={`/regal/${book.location.slotId}`} className="book-table-location">
                            <MapPin size={13} aria-hidden="true" />
                            <span>
                                {placeLabel(book.location)}
                                {book.location.room && <span className="book-table-room"> · {book.location.room}</span>}
                            </span>
                        </Link>

                        <span className="icon-btn book-table-open" aria-hidden="true">
                            <ChevronRight size={16} />
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}