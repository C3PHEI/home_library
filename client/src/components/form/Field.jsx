import './Field.css'

// Ein Formularfeld: Beschriftung, Eingabe, Fehler und Hinweis darunter.
// children ist eine Funktion und bekommt die Attribute für die Eingabe
// (id, aria-invalid, aria-describedby), damit Screenreader Fehler und Hinweis vorlesen:
//
//   <Field id="book-title" label="Titel" error={errors.title}>
//       {(props) => <input {...props} className="input field-input" ... />}
//   </Field>
//
// wide: Feld nimmt beide Spalten ein. after: zusätzlicher Inhalt unter dem Hinweis.
export default function Field({ id, label, hint, error, wide = false, after, children }) {
    const errorId = error ? `${id}-error` : undefined
    const hintId = hint ? `${id}-hint` : undefined
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

    return (
        <div className={wide ? 'field field-wide' : 'field'}>
            <label htmlFor={id} className="field-label">
                {label}
            </label>
            {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
            {error && (
                <span id={errorId} className="field-error">
                    {error}
                </span>
            )}
            {hint && (
                <span id={hintId} className="field-hint">
                    {hint}
                </span>
            )}
            {after}
        </div>
    )
}