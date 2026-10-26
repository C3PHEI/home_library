import { checkIsbn } from '../../utils/isbn.js'
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
            <label htmlFor="isbn" className="isbn-label">
                ISBN
            </label>

            <div className="isbn-row">
                <input
                    ref={inputRef}
                    id="isbn"
                    name="isbn"
                    type="text"
                    className="input isbn-input"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="z. B. 978-3-257-22800-7"
                    autoComplete="off"
                    spellCheck={false}
                    enterKeyHint="search"
                    aria-invalid={message ? true : undefined}
                    aria-describedby="isbn-hint"
                    autoFocus
                />
                <button type="submit" className="btn btn-primary isbn-button" disabled={loading}>
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
                        : 'ISBN-10 oder ISBN-13. Die Prüfziffer wird beim Eintippen geprüft.')}
            </span>
        </form>
    )
}