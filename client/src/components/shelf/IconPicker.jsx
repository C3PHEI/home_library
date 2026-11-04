import { FURNITURE_ICON_GROUPS, furnitureIconEntry } from '../../utils/furnitureIcons.js'
import './IconPicker.css'

// Auswahl eines Möbel-Icons. Echte Radio-Buttons (versteckt), damit
// Tastatur (Pfeiltasten) und Screenreader wie gewohnt funktionieren.
export default function IconPicker({ value, onChange, disabled = false }) {
    const selected = furnitureIconEntry(value)

    return (
        <fieldset className="icon-picker" disabled={disabled}>
            <legend className="field-label">Symbol</legend>

            {FURNITURE_ICON_GROUPS.map((group) => (
                <div key={group.label} className="icon-group">
                    <div className="icon-group-title">{group.label}</div>
                    <div className="icon-grid">
                        {group.icons.map(({ key, label, Icon }) => (
                            <label key={key} className="icon-option" title={label}>
                                <input
                                    type="radio"
                                    name="furniture-icon"
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
                </div>
            ))}

            <p className="icon-picker-selected" aria-live="polite">
                Gewählt: <strong>{selected.label}</strong>
            </p>
        </fieldset>
    )
}