import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowUpRight,
    BookOpen,
    BriefcaseBusiness,
    Check,
    House,
    Library,
    MapPin,
    Moon,
    Pencil,
    Sofa,
} from 'lucide-react'
import { getLocations } from '../api/locations.js'
import { useApi } from '../hooks/useApi.js'
import { useStoredState } from '../hooks/useStoredState.js'
import { formatCount, plural } from '../utils/format.js'
import { roomTarget } from '../utils/structure.js'
import PageHead from '../components/PageHead.jsx'
import Notice from '../components/Notice.jsx'
import FurnitureCard from '../components/shelf/FurnitureCard.jsx'
import EditActions from '../components/shelf/EditActions.jsx'
import RenameDialog from '../components/shelf/RenameDialog.jsx'
import DeleteDialog from '../components/shelf/DeleteDialog.jsx'
import './ShelfOverviewPage.css'

// Startseite: Zahlen oben, darunter alle Räume mit ihren Möbeln.
// Ein Möbel mit mehreren Fächern klappt auf, eines mit nur einem Fach
// führt direkt zur Fachseite (/regal/:slotId).
// Mit "Bearbeiten" lassen sich Räume, Möbel und Fächer umbenennen und löschen.
export default function ShelfOverviewPage() {
    const { data, error, loading, reload } = useApi(getLocations)

    // Welches Möbel aufgeklappt ist. Bleibt gemerkt, damit es nach
    // "Zurück" von der Fachseite noch offen ist. Immer nur eines offen.
    const [openId, setOpenId] = useStoredState('bibliothek.uebersicht.offen', null)

    const [editing, setEditing] = useState(false)
    // Offener Dialog: { kind: 'rename' | 'delete', target } (target aus utils/structure.js)
    const [dialog, setDialog] = useState(null)
    // Rückmeldung nach Umbenennen oder Löschen
    const [doneMessage, setDoneMessage] = useState(null)

    function handleToggle(furnitureId) {
        setOpenId(openId === furnitureId ? null : furnitureId)
    }

    function handleEditToggle() {
        setEditing(!editing)
        setDoneMessage(null)
    }

    function handleEdit(kind, target) {
        setDoneMessage(null)
        setDialog({ kind, target })
    }

    function handleDone(message) {
        setDialog(null)
        setDoneMessage(message)
        reload()
    }

    return (
        <div className="page overview-page">
            <PageHead
                eyebrow="Willkommen daheim"
                title="Unsere kleine Bibliothek"
                lead="Alles an seinem Platz. Und jedes Buch nur einen Augenblick entfernt."
                actions={
                    <Link to="/erfassen" className="btn btn-primary">
                        <BookOpen size={17} aria-hidden="true" />
                        Buch hinzufügen
                    </Link>
                }
            />

            {loading && !data && <p className="state-message">Regale werden geladen …</p>}

            {error && (
                <div className="state-message state-error" role="alert">
                    <span>Die Regale konnten nicht geladen werden: {error.message}</span>
                    <button type="button" className="btn btn-secondary" onClick={reload}>
                        Nochmals versuchen
                    </button>
                </div>
            )}

            {data && (
                <>
                    <Stats totals={data.totals} />

                    <div className="section-title">
                        <div>
                            <div className="eyebrow">Ein Blick durchs Haus</div>
                            <h2>Wo stehen unsere Bücher?</h2>
                        </div>
                        <div className="section-tools">
                            {data.rooms.length > 0 && (
                                <button
                                    type="button"
                                    className={editing ? 'btn btn-primary btn-small' : 'btn btn-outline btn-small'}
                                    onClick={handleEditToggle}
                                >
                                    {editing ? (
                                        <Check size={15} aria-hidden="true" />
                                    ) : (
                                        <Pencil size={15} aria-hidden="true" />
                                    )}
                                    {editing ? 'Fertig' : 'Bearbeiten'}
                                </button>
                            )}
                            <Link to="/buecher" className="section-link">
                                Alle Bücher ansehen
                                <ArrowUpRight size={15} aria-hidden="true" />
                            </Link>
                        </div>
                    </div>

                    {(editing || doneMessage) && (
                        <div className="overview-notices">
                            {editing && (
                                <Notice variant="info" title="Namen ändern oder löschen">
                                    Stift: Namen ändern. Papierkorb: Raum, Möbelstück oder Fach löschen.
                                    Bücher bleiben dabei immer erhalten.
                                </Notice>
                            )}
                            {doneMessage && <Notice variant="success" title={doneMessage} />}
                        </div>
                    )}

                    {data.rooms.length === 0 && (
                        <p className="room-empty">Noch keine Möbel erfasst.</p>
                    )}

                    {data.rooms.map((room) => (
                        <Room
                            key={room.room}
                            room={room}
                            openId={openId}
                            onToggle={handleToggle}
                            editing={editing}
                            onEdit={handleEdit}
                        />
                    ))}
                </>
            )}

            {dialog?.kind === 'rename' && (
                <RenameDialog target={dialog.target} onClose={() => setDialog(null)} onDone={handleDone} />
            )}
            {dialog?.kind === 'delete' && data && (
                <DeleteDialog
                    target={dialog.target}
                    rooms={data.rooms}
                    onClose={() => setDialog(null)}
                    onDone={handleDone}
                />
            )}
        </div>
    )
}

function Stats({ totals }) {
    const items = [
        { value: totals.furniture, label: 'Möbelstücke', icon: Library },
        { value: totals.slots, label: 'Orte für Bücher', icon: MapPin },
        { value: totals.books, label: 'Bücher eingetragen', icon: BookOpen },
    ]

    return (
        <div className="stat-row">
            {items.map(({ value, label, icon: Icon }) => (
                <div key={label} className="card stat">
                    <div>
                        <div className="stat-number">{formatCount(value)}</div>
                        <div className="stat-label">{label}</div>
                    </div>
                    <Icon className="stat-icon" size={22} aria-hidden="true" />
                </div>
            ))}
        </div>
    )
}

function Room({ room, openId, onToggle, editing, onEdit }) {
    const slotCount = room.furniture.reduce((sum, furniture) => sum + furniture.slots.length, 0)
    const headingId = `room-${room.room.toLowerCase().replace(/\s+/g, '-')}`
    // Möbel ohne Raum (key null) erscheinen unter "Ohne Raum": nichts zum Umbenennen
    const canEditRoom = editing && room.key !== null

    return (
        <section className="room-section" aria-labelledby={headingId}>
            <div className="room-heading">
                <RoomIcon name={room.room} />
                <h2 id={headingId}>{room.room}</h2>
                <span className="room-count">
                    {plural(room.furniture.length, 'Möbelstück', 'Möbelstücke')} · {plural(slotCount, 'Fach', 'Fächer')}
                </span>
                {canEditRoom && (
                    <span className="room-actions">
                        <EditActions
                            name={`Raum ${room.room}`}
                            onRename={() => onEdit('rename', roomTarget(room))}
                            onDelete={() => onEdit('delete', roomTarget(room))}
                        />
                    </span>
                )}
            </div>

            <div className="furniture-list">
                {room.furniture.map((furniture) => (
                    <FurnitureCard
                        key={furniture.id}
                        furniture={furniture}
                        open={openId === furniture.id}
                        onToggle={() => onToggle(furniture.id)}
                        editing={editing}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </section>
    )
}

// Icon neben dem Raumnamen
function RoomIcon({ name }) {
    const lower = name.toLowerCase()
    const props = { size: 19, 'aria-hidden': true }
    if (lower.includes('wohn')) return <Sofa {...props} />
    if (lower.includes('schlaf')) return <Moon {...props} />
    if (lower.includes('büro') || lower.includes('buero') || lower.includes('arbeit')) {
        return <BriefcaseBusiness {...props} />
    }
    return <House {...props} />
}