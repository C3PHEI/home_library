import './RequiredFields.css'

// Box "Pflichtfelder" aus Erfassen-Manuell.html.
// Zeigt laufend, welche der drei Angaben schon stehen.
// missing: Namen der fehlenden Felder, z. B. ['Autor', 'Standort']
const REQUIRED = ['Titel', 'Autor', 'Standort']

export default function RequiredFields({ missing }) {
    const allDone = missing.length === 0

    return (
        <section className="side-card required-fields" aria-labelledby="required-fields-title">
            <h2 id="required-fields-title" className="side-card-title">
                Pflichtfelder
            </h2>

            <ul className="required-list">
                {REQUIRED.map((name) => {
                    const done = !missing.includes(name)
                    return (
                        <li key={name} className={done ? 'required-item is-done' : 'required-item'}>
                            <span className="required-dot" aria-hidden="true">
                                {done && <CheckIcon />}
                            </span>
                            {name}
                            <span className="visually-hidden">{done ? ' – ausgefüllt' : ' – fehlt noch'}</span>
                        </li>
                    )
                })}
            </ul>

            <p className="side-card-note" aria-live="polite">
                {allDone
                    ? 'Alles da, das Buch lässt sich speichern.'
                    : 'Ohne diese drei Angaben bleibt die Schaltfläche zum Speichern gesperrt.'}
            </p>
        </section>
    )
}

function CheckIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"
             strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}