import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import './SearchForm.css'

// So lange nach dem letzten Tastendruck warten, bis gesucht wird
const SEARCH_DELAY = 350

// Suchfeld wie im neuen Mock: Lupe links, kein Button.
// Gesucht wird beim Tippen (kurz verzögert) oder sofort mit Enter.
// query = Suchbegriff aus der URL.
export default function SearchForm({ query, onSearch }) {
    const [text, setText] = useState(query)
    // Letzter Begriff, den dieses Feld kennt (selbst gesendet oder aus der URL)
    const [knownQuery, setKnownQuery] = useState(query)
    const timer = useRef(null)
    const inputRef = useRef(null)

    // Die URL hat sich von aussen geändert (Zurück-Taste, Link): Feld nachführen
    if (query !== knownQuery) {
        setKnownQuery(query)
        setText(query)
    }

    // Offene Verzögerung beim Verlassen der Seite abbrechen
    useEffect(() => () => clearTimeout(timer.current), [])

    function send(value) {
        clearTimeout(timer.current)
        const next = value.trim()
        setKnownQuery(next)
        onSearch(next)
    }

    function handleChange(event) {
        const value = event.target.value
        setText(value)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => send(value), SEARCH_DELAY)
    }

    function handleSubmit(event) {
        event.preventDefault()
        send(text)
    }

    function handleClear() {
        setText('')
        send('')
        inputRef.current?.focus()
    }

    return (
        <form className="search-box" role="search" onSubmit={handleSubmit}>
            <Search size={19} aria-hidden="true" />
            <label htmlFor="search-page-input" className="visually-hidden">
                Titel, Autor oder ISBN suchen
            </label>
            <input
                ref={inputRef}
                id="search-page-input"
                type="text"
                inputMode="search"
                className="search-box-input"
                placeholder="Zum Beispiel: Der kleine Prinz"
                value={text}
                onChange={handleChange}
                autoFocus={query === ''}
                autoComplete="off"
                enterKeyHint="search"
            />
            {text !== '' && (
                <button type="button" className="search-box-clear" onClick={handleClear} title="Eingabe löschen">
                    <X size={16} aria-hidden="true" />
                    <span className="visually-hidden">Eingabe löschen</span>
                </button>
            )}
        </form>
    )
}