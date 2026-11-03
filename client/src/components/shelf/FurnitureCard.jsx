import { Link } from 'react-router-dom'
import { Archive, BookOpen, ChevronDown, ChevronRight, DoorOpen, Layers, Moon, Sofa } from 'lucide-react'
import { furnitureTypeLabel } from '../../utils/furniture.js'
import { plural } from '../../utils/format.js'
import './FurnitureCard.css'

// Ein Möbel in der Übersicht.
// - Nur ein Fach (Tisch, Nachttisch): die ganze Karte führt zum Fach.
// - Mehrere Fächer: Kopf klappt die Liste der Fächer auf und zu.
export default function FurnitureCard({ furniture, open, onToggle }) {
    const { slots } = furniture

    if (slots.length === 1) {
        return (
            <Link to={`/regal/${slots[0].id}`} className="furniture-card furniture-single card">
                <div className="furniture-heading">
                    <FurnitureHead furniture={furniture} />
                    <CountPill count={furniture.bookCount} />
                    <ChevronRight className="furniture-arrow" size={17} aria-hidden="true" />
                </div>
            </Link>
        )
    }

    if (slots.length === 0) {
        return (
            <div className="furniture-card card">
                <div className="furniture-heading">
                    <FurnitureHead furniture={furniture} />
                    <span className="furniture-total">Keine Fächer angelegt</span>
                </div>
            </div>
        )
    }

    const listId = `compartments-${furniture.id}`

    return (
        <section className={open ? 'furniture-card card is-expanded' : 'furniture-card card'}>
            <button
                type="button"
                className="furniture-heading furniture-toggle"
                aria-expanded={open}
                aria-controls={listId}
                onClick={onToggle}
            >
                <FurnitureHead furniture={furniture} />
                <span className="furniture-total">
                    {plural(furniture.bookCount, 'Buch', 'Bücher')} · {plural(slots.length, 'Fach', 'Fächer')}
                </span>
                <ChevronDown className="furniture-toggle-icon" size={17} aria-hidden="true" />
            </button>

            <div className="compartment-list" id={listId} hidden={!open}>
                {slots.map((slot) => (
                    <Link
                        key={slot.id}
                        to={`/regal/${slot.id}`}
                        className={slot.bookCount === 0 ? 'compartment-card is-empty' : 'compartment-card'}
                    >
                        <Layers className="compartment-icon" size={16} aria-hidden="true" />
                        <span className="compartment-name">{slot.label}</span>
                        <CountPill count={slot.bookCount} />
                    </Link>
                ))}
            </div>
        </section>
    )
}

// Icon, Art ("REGAL") und Name
function FurnitureHead({ furniture }) {
    return (
        <>
            <span className="furniture-mark" aria-hidden="true">
                <TypeIcon type={furniture.type} />
            </span>
            <span className="furniture-label">
                <span className="furniture-type">{furnitureTypeLabel(furniture.type)}</span>
                {/* span statt h3: Überschriften sind in einem Button nicht erlaubt */}
                <span className="furniture-name">{furniture.name}</span>
            </span>
        </>
    )
}

function CountPill({ count }) {
    return (
        <span className={count === 0 ? 'count-pill is-empty' : 'count-pill'}>
            {count === 0 ? 'Noch leer' : plural(count, 'Buch', 'Bücher')}
        </span>
    )
}

// Icon je Möbeltyp (siehe utils/furniture.js)
function TypeIcon({ type }) {
    switch (type) {
        case 'cabinet':
            return <DoorOpen size={18} />
        case 'nightstand':
            return <Moon size={18} />
        case 'table':
            return <Sofa size={18} />
        case 'other':
            return <Archive size={18} />
        default:
            return <BookOpen size={18} />
    }
}