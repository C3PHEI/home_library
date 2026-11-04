import './IconPicker.css'

// Auswahl eines Icons. Echte Radio-Buttons (versteckt), damit
// Tastatur (Pfeiltasten) und Screenreader wie gewohnt funktionieren.
// icons: FURNITURE_ICONS oder ROOM_ICONS aus utils/icons.js
export default function IconPicker({ icons, value, onChange, disabled = false }) {
    const selected = icons.find((entry) => entry.key === value)

    return (
        <fieldset className="icon-picker" disabled={disabled}>
            <legend className="field-label">Symbol</legend>

            <div className="icon-grid">
                {icons.map(({ key, label, Icon }) => (
                    <label key={key} className="icon-option" title={label}>
                        <input
                            type="radio"
                            name="icon"
                            value={key}
                            checked={value === key}
                            onChange={() => onChange(key)}
                            className="visually-hidden"
                        />
                        <Icon size={19} aria-hidden="true" />
                        <span className="visually-hidden">{label}</span>
                    </label>
                ))}
            </div>

            {selected && (
                <p className="icon-picker-selected" aria-live="polite">
                    Gewählt: <strong>{selected.label}</strong>
                </p>
            )}
        </fieldset>
    )
}