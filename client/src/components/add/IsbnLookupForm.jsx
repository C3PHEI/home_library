import { Search } from 'lucide-react'
import { checkIsbn } from '../../utils/isbn.js'
import '../form/Field.css'
import './IsbnLookupForm.css'

// ISBN-Feld mit "Daten holen". Eigenes <form>, damit Enter im Feld den Abruf
// startet und nicht das Buch speichert.
// error: Meldung von aussen (Klick auf "Daten holen" oder 400 vom Backend)
export default function IsbnLookupForm({ value, onChange, onLookup, error, loading, inputRef }) {
    const check = checkIsbn(value)
    // Falsche Zeichen oder falsche Prüfziffer bei 13 Stellen sofort zeigen
    const message = error ?? (check.state === 'invalid' ? check.message : null)
    const valid = !message && check.state === 'valid'

    function handleSubmit(event) {
        event.preventDefault()
        onLookup()
    }

    return (
        <form className="isbn-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="isbn" className="field-label">
                ISBN
            </label>

            <div className="isbn-row">
                <input
                    ref={inputRef}
                    id="isbn"
                    name="isbn"
                    type="text"
                    className="input field-input is-mono isbn-input"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Zum Beispiel 978-3-257-22800-7"
                    autoComplete="off"
                    spellCheck={false}
                    enterKeyHint="search"
                    aria-invalid={message ? true : undefined}
                    aria-describedby="isbn-hint"
                    autoFocus
                />
                <button type="submit" className="btn btn-secondary isbn-button" disabled={loading}>
                    <Search size={16} aria-hidden="true" />
                    {loading ? 'Wird geholt …' : 'Daten holen'}
                </button>
            </div>

            <span
                id="isbn-hint"
                className={message ? 'isbn-hint is-error' : valid ? 'isbn-hint is-valid' : 'isbn-hint'}
                aria-live="polite"
            >
                {message ??
                    (valid
                        ? `Prüfziffer stimmt (${check.kind}).`
                        : 'Die ISBN steht meist hinten auf dem Buch beim Strichcode. 10 oder 13 Stellen.')}
            </span>
        </form>
    )
}