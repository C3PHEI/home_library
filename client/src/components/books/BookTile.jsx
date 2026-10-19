import { Link } from 'react-router-dom'
import BookCover from './BookCover.jsx'
import './BookTile.css'

// Kachel mit Cover, Titel und Autor. from = Adresse, zu der die Buchdetailseite zurückführt
export default function BookTile({ book, from }) {
    return (
        <Link to={`/buecher/${book.id}`} state={{ from }} className="book-tile">
            <BookCover src={book.coverThumbUrl} variant="tile" />
            <span className="book-tile-title">{book.title}</span>
            {book.author && <span className="book-tile-author">{book.author}</span>}
            {book.loanedTo && <span className="book-loaned">Verliehen an {book.loanedTo}</span>}
        </Link>
    )
}