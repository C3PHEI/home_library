import Field from '../form/Field.jsx'
import { LANGUAGES, languageLabel } from '../../utils/languages.js'
import './BookFormFields.css'

// Die Buchfelder aus Erfassen-ISBN.html (Titel bis Notiz).
// Auch für "Erfassen ohne ISBN" gedacht, darum ohne ISBN-Feld.
//
// values:    { title, author, publisher, publishedYear, language, pages, shelfSlotId, note } (alles Strings)
// errors:    { title: 'Pflichtfeld', ... }
// onChange:  (name, value) => void
// locations: { groups, loading, error, reload } für das Standort-Dropdown
export default function BookFormFields({ values, errors, onChange, locations }) {
    function bind(name) {
        return {
            name,
            value: values[name],
            onChange: (event) => onChange(name, event.target.value),
        }
    }

    // Sprache aus dem ISBN-Abruf, die nicht in der Liste steht (z. B. "nl"): trotzdem anbieten
    const extraLanguage =
        values.language && !LANGUAGES.some((language) => language.code === values.language)
            ? values.language
            : null

    return (
        <div className="book-fields">
            <Field id="book-title" label="Titel (Pflicht)" error={errors.title} wide>
                {(props) => <input {...props} {...bind('title')} type="text" className="input field-input" maxLength={500} />}
            </Field>

            <Field
                id="book-author"
                label="Autor (Pflicht)"
                hint="Mehrere Autoren mit Komma trennen."
                error={errors.author}
                wide
            >
                {(props) => <input {...props} {...bind('author')} type="text" className="input field-input" maxLength={500} />}
            </Field>

            <Field id="book-publisher" label="Verlag" error={errors.publisher}>
                {(props) => <input {...props} {...bind('publisher')} type="text" className="input field-input" maxLength={500} />}
            </Field>

            <Field id="book-year" label="Erscheinungsjahr" error={errors.publishedYear}>
                {(props) => (
                    <input
                        {...props}
                        {...bind('publishedYear')}
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        className="input field-input is-mono"
                    />
                )}
            </Field>

            <Field id="book-language" label="Sprache" error={errors.language}>
                {(props) => (
                    <select {...props} {...bind('language')} className="select field-input">
                        <option value="">Keine Angabe</option>
                        {LANGUAGES.map((language) => (
                            <option key={language.code} value={language.code}>
                                {language.label}
                            </option>
                        ))}
                        {extraLanguage && <option value={extraLanguage}>{languageLabel(extraLanguage)}</option>}
                    </select>
                )}
            </Field>

            <Field id="book-pages" label="Seitenzahl" error={errors.pages}>
                {(props) => (
                    <input
                        {...props}
                        {...bind('pages')}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="input field-input is-mono"
                    />
                )}
            </Field>

            <LocationField
                value={values.shelfSlotId}
                error={errors.shelfSlotId}
                onChange={(value) => onChange('shelfSlotId', value)}
                locations={locations}
            />

            <Field id="book-note" label="Notiz" error={errors.note} wide>
                {(props) => (
                    <textarea
                        {...props}
                        {...bind('note')}
                        rows={2}
                        className="input field-input"
                        placeholder="Freitext, zum Beispiel Geschenk von Anna"
                        maxLength={5000}
                    />
                )}
            </Field>
        </div>
    )
}

// Standort-Dropdown, nach Raum gruppiert (<optgroup>)
function LocationField({ value, error, onChange, locations }) {
    const { groups, loading, error: loadError, reload } = locations
    const ready = groups.length > 0

    let placeholder = 'Standort wählen'
    if (loading) placeholder = 'Standorte werden geladen …'
    else if (loadError) placeholder = 'Standorte nicht verfügbar'
    else if (!ready) placeholder = 'Noch keine Standorte erfasst'

    return (
        <Field
            id="book-location"
            label="Standort (Pflicht)"
            hint="Genau ein Standort. Nach dem Speichern steht die Auswahl wieder leer."
            error={error ?? (loadError ? `Die Standorte konnten nicht geladen werden: ${loadError.message}` : undefined)}
            wide
            after={
                loadError && (
                    <button type="button" className="btn btn-secondary book-fields-retry" onClick={reload}>
                        Standorte nochmals laden
                    </button>
                )
            }
        >
            {(props) => (
                <select
                    {...props}
                    name="shelfSlotId"
                    className={value ? 'select field-input is-chosen' : 'select field-input'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={!ready}
                >
                    <option value="">{placeholder}</option>
                    {groups.map((group) => (
                        <optgroup key={group.room} label={group.room}>
                            {group.options.map((option) => (
                                <option key={option.id} value={String(option.id)}>
                                    {option.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            )}
        </Field>
    )
}