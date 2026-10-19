import { Fragment } from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import { getLocations } from '../api/locations.js'
import { useApi } from '../hooks/useApi.js'
import { MOBILE_QUERY, useMediaQuery } from '../hooks/useMediaQuery.js'
import { plural } from '../utils/format.js'
import FurnitureCard from '../components/shelf/FurnitureCard.jsx'
import Legend from '../components/shelf/Legend.jsx'
import './ShelfOverviewPage.css'

// Regalübersicht. Unter /regal/:slotId öffnet die Bücherliste der Reihe
// (Unterroute, <Outlet />) ohne Seitenwechsel: rechts daneben auf dem Desktop,
// auf dem Handy direkt unter dem Möbel.
export default function ShelfOverviewPage() {
    const { data, error, loading, reload } = useApi(getLocations)
    const match = useMatch('/regal/:slotId')
    const selectedSlotId = match ? Number(match.params.slotId) : null
    const hasSelection = selectedSlotId !== null
    const isMobile = useMediaQuery(MOBILE_QUERY)

    const selection = data && hasSelection ? findSlot(data.rooms, selectedSlotId) : null

    const panelBeside = hasSelection && !isMobile
    const panelUnderFurniture = hasSelection && isMobile && selection !== null
    // Handy, Reihe nicht in der Übersicht (z. B. falsche Adresse): Panel oben zeigen
    const panelOnTop = hasSelection && isMobile && (error || (data && !selection))

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h1 className="page-title">Regalübersicht</h1>
                    <p className="page-lead">{leadText(data, selection)}</p>
                </div>
                <Legend showSelected={hasSelection} />
            </div>

            <div className={panelBeside ? 'shelf-layout has-panel' : 'shelf-layout'}>
                <div className="shelf-rooms">
                    {panelOnTop && (
                        <div className="shelf-panel-top">
                            <Outlet />
                        </div>
                    )}

                    {loading && !data && <p className="state-message">Regale werden geladen …</p>}

                    {error && (
                        <div className="state-message state-error" role="alert">
                            <span>Die Regale konnten nicht geladen werden: {error.message}</span>
                            <button type="button" className="btn btn-secondary" onClick={reload}>
                                Nochmals versuchen
                            </button>
                        </div>
                    )}

                    {data && data.rooms.length === 0 && (
                        <p className="state-message">Noch keine Möbel erfasst.</p>
                    )}

                    {data?.rooms.map((room) => (
                        <section key={room.room} className="room" aria-labelledby={roomId(room.room)}>
                            <h2 id={roomId(room.room)} className="room-title">
                                {room.room}
                            </h2>
                            <div className="furniture-grid">
                                {room.furniture.map((furniture) => (
                                    <Fragment key={furniture.id}>
                                        <FurnitureCard
                                            furniture={furniture}
                                            selectedSlotId={selectedSlotId}
                                            compact={panelBeside}
                                        />
                                        {panelUnderFurniture && selection.furniture.id === furniture.id && (
                                            <div className="shelf-panel-inline">
                                                <Outlet />
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {panelBeside && (
                    <div className="shelf-panel-column">
                        <Outlet />
                    </div>
                )}
            </div>
        </div>
    )
}

function leadText(data, selection) {
    if (selection) {
        return `${selection.slot.label} in ${selection.furniture.name} ist ausgewählt. Eine andere Reihe anklicken, um zu wechseln.`
    }
    if (!data) return 'Eine Reihe anklicken, um ihre Bücher zu sehen.'

    const { furniture, slots, books } = data.totals
    return `${plural(furniture, 'Möbel', 'Möbel')}, ${plural(slots, 'Standort', 'Standorte')}, ${plural(books, 'Buch', 'Bücher')}. Eine Reihe anklicken, um ihre Bücher zu sehen.`
}

function findSlot(rooms, slotId) {
    for (const room of rooms) {
        for (const furniture of room.furniture) {
            const slot = furniture.slots.find((s) => s.id === slotId)
            if (slot) return { room, furniture, slot }
        }
    }
    return null
}

function roomId(name) {
    return `room-${name.toLowerCase().replace(/\s+/g, '-')}`
}