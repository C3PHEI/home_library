import { getLocations } from '../api/locations.js'
import { useApi } from '../hooks/useApi.js'
import { plural } from '../utils/format.js'
import FurnitureCard from '../components/shelf/FurnitureCard.jsx'
import Legend from '../components/shelf/Legend.jsx'
import './ShelfOverviewPage.css'

export default function ShelfOverviewPage() {
    const { data, error, loading, reload } = useApi(getLocations)

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h1 className="page-title">Regalübersicht</h1>
                    <p className="page-lead">
                        {data ? (
                            <>
                                {plural(data.totals.furniture, 'Möbel', 'Möbel')},{' '}
                                {plural(data.totals.slots, 'Standort', 'Standorte')},{' '}
                                {plural(data.totals.books, 'Buch', 'Bücher')}. Eine Reihe anklicken, um ihre Bücher zu sehen.
                            </>
                        ) : (
                            'Eine Reihe anklicken, um ihre Bücher zu sehen.'
                        )}
                    </p>
                </div>
                <Legend />
            </div>

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
                            <FurnitureCard key={furniture.id} furniture={furniture} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}

function roomId(name) {
    return `room-${name.toLowerCase().replace(/\s+/g, '-')}`
}