import { Link } from 'react-router-dom'
import {
    ArrowUpRight,
    BookOpen,
    BriefcaseBusiness,
    House,
    Library,
    MapPin,
    Moon,
    Sofa,
} from 'lucide-react'
import { getLocations } from '../api/locations.js'
import { useApi } from '../hooks/useApi.js'
import { useStoredState } from '../hooks/useStoredState.js'
import { formatCount, plural } from '../utils/format.js'
import PageHead from '../components/PageHead.jsx'
import FurnitureCard from '../components/shelf/FurnitureCard.jsx'
import './ShelfOverviewPage.css'

// Startseite: Zahlen oben, darunter alle Räume mit ihren Möbeln.
// Ein Möbel mit mehreren Fächern klappt auf, eines mit nur einem Fach
// führt direkt zur Fachseite (/regal/:slotId).
export default function ShelfOverviewPage() {
    const { data, error, loading, reload } = useApi(getLocations)

    // Welches Möbel aufgeklappt ist. Bleibt gemerkt, damit es nach
    // "Zurück" von der Fachseite noch offen ist. Immer nur eines offen.
    const [openId, setOpenId] = useStoredState('bibliothek.uebersicht.offen', null)

    function handleToggle(furnitureId) {
        setOpenId(openId === furnitureId ? null : furnitureId)
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
                        <Link to="/buecher" className="section-link">
                            Alle Bücher ansehen
                            <ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                    </div>

                    {data.rooms.length === 0 && (
                        <p className="room-empty">Noch keine Möbel erfasst.</p>
                    )}

                    {data.rooms.map((room) => (
                        <Room key={room.room} room={room} openId={openId} onToggle={handleToggle} />
                    ))}
                </>
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

function Room({ room, openId, onToggle }) {
    const slotCount = room.furniture.reduce((sum, furniture) => sum + furniture.slots.length, 0)
    const headingId = `room-${room.room.toLowerCase().replace(/\s+/g, '-')}`

    return (
        <section className="room-section" aria-labelledby={headingId}>
            <div className="room-heading">
                <RoomIcon name={room.room} />
                <h2 id={headingId}>{room.room}</h2>
                <span className="room-count">
                    {plural(room.furniture.length, 'Möbelstück', 'Möbelstücke')} · {plural(slotCount, 'Fach', 'Fächer')}
                </span>
            </div>

            <div className="furniture-list">
                {room.furniture.map((furniture) => (
                    <FurnitureCard
                        key={furniture.id}
                        furniture={furniture}
                        open={openId === furniture.id}
                        onToggle={() => onToggle(furniture.id)}
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