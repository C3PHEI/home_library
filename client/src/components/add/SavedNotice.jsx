import { Link } from 'react-router-dom'
import Notice from '../Notice.jsx'
import { placeLabel } from '../../utils/location.js'

// Grüne Box oben nach dem Speichern, mit Weg zur Reihe und zum Buch.
// result: Antwort von POST /api/books ({ book, warnings })
export default function SavedNotice({ result }) {
    const { book, warnings = [] } = result
    const duplicate = warnings.some((warning) => warning.code === 'DUPLICATE_ISBN')
    const coverFailed = warnings.some((warning) => warning.code === 'COVER_NOT_SAVED')
    const place = [book.location.room, placeLabel(book.location)].filter(Boolean).join(', ')

    return (
        <Notice
            variant={coverFailed ? 'caution' : 'success'}
            title={`„${book.title}“ ist gespeichert, in ${place}`}
            action={
                <>
                    <Link to={`/regal/${book.location.slotId}`} className="btn btn-secondary">
                        Zur Reihe
                    </Link>
                    <Link to={`/buecher/${book.id}`} className="btn btn-secondary">
                        Buch ansehen
                    </Link>
                </>
            }
        >
            {duplicate && 'Ein weiteres Exemplar, die ISBN stand schon im Bestand. '}
            {coverFailed && 'Das Cover wurde nicht gespeichert, es lässt sich im Buchdetail nachtragen. '}
            Das Formular ist leer für das nächste Buch.
        </Notice>
    )
}