import { Link } from 'react-router-dom'
import { Archive, BookOpen, ChevronDown, ChevronRight, DoorOpen, Layers, Moon, Sofa } from 'lucide-react'
import { furnitureTypeLabel } from '../../utils/furniture.js'
import { plural } from '../../utils/format.js'
import { furnitureTarget, slotTarget } from '../../utils/structure.js'
import EditActions from './EditActions.jsx'
import './FurnitureCard.css'

// Ein Möbel in der Übersicht.
// - Nur ein Fach (Tisch, Nachttisch): die ganze Karte führt zum Fach.
// - Mehrere Fächer: Kopf klappt die Liste der Fächer auf und zu.
// editing: Bearbeiten-Modus. Dann gibt es Stift und Papierkorb, und Karten
// und Fächer sind keine Links, damit ein Klick daneben nicht wegführt.
// onEdit(kind, target): kind ist 'rename' oder 'delete', target aus utils/structure.js
export default function FurnitureCard({ furniture, open, onToggle, editing = false, onEdit }) {
    const { slots } = furniture

    const actions = editing && (
        <EditActions
            name={furniture.name}
            onRename={() => onEdit('rename', furnitureTarget(furniture))}
            onDelete={() => onEdit('delete', furnitureTarget(furniture))}
        />
    )

    if (slots.length === 1 && !editing) {
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

    // Ein Fach im Bearbeiten-Modus, oder gar keine Fächer
    if (slots.length <= 1) {
        return (
            <div className="furniture-card card">
                <div className="furniture-heading">
                    <FurnitureHead furniture={furniture} />
                    {slots.length === 1 ? (
                        <CountPill count={furniture.bookCount} />
                    ) : (
                        <span className="furniture-total">Keine Fächer angelegt</span>
                    )}
                    {actions}
                </div>
            </div>
        )
    }

    const listId = `compartments-${furniture.id}`

    return (
        <section className={open ? 'furniture-card card is-expanded' : 'furniture-card card'}>
            <div className="furniture-heading">
                <button
                    type="button"
                    className="furniture-toggle"
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
                {actions}
            </div>

            <div className="compartment-list" id={listId} hidden={!open}>
                {slots.map((slot) =>
                    editing ? (
                        <div
                            key={slot.id}
                            className={slot.bookCount === 0 ? 'compartment-card is-editing is-empty' : 'compartment-card is-editing'}
                        >
                            <Layers className="compartment-icon" size={16} aria-hidden="true" />
                            <span className="compartment-name">{slot.label}</span>
                            <EditActions
                                name={`${slot.label} in ${furniture.name}`}
                                onRename={() => onEdit('rename', slotTarget(slot, furniture))}
                                onDelete={() => onEdit('delete', slotTarget(slot, furniture))}
                            />
                        </div>
                    ) : (
                        <Link
                            key={slot.id}
                            to={`/regal/${slot.id}`}
                            className={slot.bookCount === 0 ? 'compartment-card is-empty' : 'compartment-card'}
                        >
                            <Layers className="compartment-icon" size={16} aria-hidden="true" />
                            <span className="compartment-name">{slot.label}</span>
                            <CountPill count={slot.bookCount} />
                        </Link>
                    ),
                )}
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