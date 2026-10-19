import './Legend.css'

// showSelected: zusätzlich "ausgewählt" zeigen, wenn eine Reihe offen ist
export default function Legend({ showSelected = false }) {
    return (
        <div className="legend" aria-hidden="true">
            {showSelected && (
                <span className="legend-item">
                    <span className="legend-swatch legend-swatch-selected" />
                    ausgewählt
                </span>
            )}
            <span className="legend-item">
                <span className="legend-swatch legend-swatch-filled" />
                mit Büchern
            </span>
            <span className="legend-item">
                <span className="legend-swatch legend-swatch-empty" />
                leer
            </span>
        </div>
    )
}