import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, MapPin } from 'lucide-react'
import BookCover from './BookCover.jsx'
import { placeLabel } from '../../utils/location.js'
import './BookTable.css'

// Bücherliste wie im neuen Mock (.book-table): Titel, Autor, Jahr, Standort.
// PC und iPad quer: Spalten nebeneinander mit Kopfzeile.
// iPad hochkant und Handy: jede Zeile wird zu drei kurzen Zeilen neben dem Cover.
// Die ganze Zeile führt zum Buch, der Standort zum Fach. from = Adresse für den Rückweg.
//
// Sortieren per Klick auf den Spaltenkopf (Titel, Autor, Jahr), der Standort ist nicht sortierbar.
// sort:   aktuelle Spalte ('title', 'author', 'year' oder etwas anderes wie 'created')
// dir:    'asc' oder 'desc'
// onSort: (spalte) => void. Fehlt onSort, sind die Spaltenköpfe nur Text.
export default function BookTable({ books, from, sort, dir, onSort }) {
    const sortProps = { sort, dir, onSort }

    return (
        <div className="book-table">
            <div className="book-table-head">
                <SortHeader column="title" label="Titel" {...sortProps} />
                <SortHeader column="author" label="Autorin / Autor" {...sortProps} />
                <SortHeader column="year" label="Jahr" {...sortProps} />
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

// Spaltenkopf zum Anklicken. Pfeil nach oben = aufsteigend (A bis Z, ältestes Jahr zuerst),
// Pfeil nach unten = absteigend. Nicht gewählte Spalten zeigen einen blassen Doppelpfeil.
function SortHeader({ column, label, sort, dir, onSort }) {
    if (!onSort) return <span>{label}</span>

    const active = sort === column
    const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
    const state = !active ? 'nicht sortiert' : dir === 'asc' ? 'aufsteigend sortiert' : 'absteigend sortiert'

    return (
        <button
            type="button"
            className={active ? 'book-table-sort is-active' : 'book-table-sort'}
            onClick={() => onSort(column)}
            aria-label={`${label}: ${state}. Klicken zum ${active ? 'Umdrehen' : 'Sortieren'}.`}
            title={active ? 'Reihenfolge umdrehen' : `Nach ${label} sortieren`}
        >
            <span>{label}</span>
            <Icon size={13} aria-hidden="true" />
        </button>
    )
}