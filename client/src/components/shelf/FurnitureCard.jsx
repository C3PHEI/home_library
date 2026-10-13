import { formatCount } from '../../utils/format.js'
import SlotLink from './SlotLink.jsx'
import './FurnitureCard.css'

export default function FurnitureCard({ furniture }) {
    return (
        <div className="furniture-card">
            <div className="furniture-card-head">
                <span className="furniture-name">{furniture.name}</span>
                <span className="furniture-count" title="Bücher in diesem Möbel">
          {formatCount(furniture.bookCount)}
        </span>
            </div>

            {furniture.slots.length > 0 ? (
                <div className="slot-list">
                    {furniture.slots.map((slot) => (
                        <SlotLink key={slot.id} slot={slot} furnitureName={furniture.name} />
                    ))}
                </div>
            ) : (
                <p className="furniture-empty">Keine Reihen angelegt</p>
            )}
        </div>
    )
}