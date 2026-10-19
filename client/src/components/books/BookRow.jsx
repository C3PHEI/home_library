import { Link } from 'react-router-dom'
import BookCover from './BookCover.jsx'
import './BookRow.css'

// Listenzeile: kleines Cover, Titel, Autor, Erscheinungsjahr rechts
export default function BookRow({ book, from }) {
    return (
        <Link to={`/buecher/${book.id}`} state={{ from }} className="book-row">
            <BookCover src={book.coverThumbUrl} variant="row" />
            <span className="book-row-text">
                <span className="book-row-title">{book.title}</span>
                {book.author && <span className="book-row-author">{book.author}</span>}
                {book.loanedTo && <span className="book-loaned">Verliehen an {book.loanedTo}</span>}
            </span>
            {book.publishedYear && <span className="book-row-year">{book.publishedYear}</span>}
        </Link>
    )
}