import { joinGerman } from '../../utils/format.js'
import { placeLabel } from '../../utils/location.js'
import SearchNote from './SearchNote.jsx'

const MAX_LISTED = 3

// Hinweis unter den Treffern, wenn dasselbe Buch mehrmals vorkommt.
// groups: Ergebnis von findDuplicateGroups()
export default function DuplicateNote({ groups }) {
    if (groups.length === 0) return null

    const listed = groups.slice(0, MAX_LISTED)
    const more = groups.length - listed.length

    return (
        <SearchNote>
            {listed.map((group) => (
                <span key={group[0].id} className="duplicate-line">
                    <strong>„{group[0].title}“</strong> steht {group.length}-mal in der Sammlung:{' '}
                    {joinGerman(group.map((book) => placeLabel(book.location)))}.
                </span>
            ))}
            {more > 0 && (
                <span className="duplicate-line">
                    Dazu {more} weitere {more === 1 ? 'Buch' : 'Bücher'} mit mehreren Exemplaren.
                </span>
            )}
            <span className="duplicate-line">Doppelte Exemplare sind eigenständige Einträge.</span>
        </SearchNote>
    )
}