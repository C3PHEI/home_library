import './Legend.css'

export default function Legend() {
    return (
        <div className="legend" aria-hidden="true">
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