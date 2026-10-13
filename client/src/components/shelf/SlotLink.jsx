import { Link } from 'react-router-dom'
import { formatCount, plural } from '../../utils/format.js'

export default function SlotLink({ slot, furnitureName }) {
    const empty = slot.bookCount === 0

    return (
        <Link
            to={`/regal/${slot.id}`}
            className={empty ? 'slot slot-empty' : 'slot'}
            aria-label={`${furnitureName}, ${slot.label}: ${empty ? 'leer' : plural(slot.bookCount, 'Buch', 'Bücher')}`}
        >
            <span>{slot.label}</span>
            <span className="slot-count">{empty ? 'leer' : formatCount(slot.bookCount)}</span>
        </Link>
    )
}