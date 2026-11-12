import './Segmented.css'

// Umschalter aus dem neuen Mock (.segmented): zwei oder mehr Möglichkeiten nebeneinander,
// die gewählte liegt als helle Fläche obenauf.
//
// label:    Beschriftung für Screenreader ("Art der Eingabe")
// options:  [{ value: 'isbn', label: 'Mit ISBN beginnen' }, ...]
// value:    gewählter Wert
// onChange: (value) => void
export default function Segmented({ label, options, value, onChange }) {
    return (
        <div className="segmented" role="group" aria-label={label}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className="segmented-option"
                    aria-pressed={option.value === value}
                    onClick={() => option.value !== value && onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}