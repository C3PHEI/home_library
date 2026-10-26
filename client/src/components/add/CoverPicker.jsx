import { useRef } from 'react'
import BookCover from '../books/BookCover.jsx'
import { sourceLabel } from './sources.js'
import './CoverPicker.css'

// Cover-Box rechts: Vorschau, Auswahl und eigenes Bild hochladen.
// Gewählt wird zwischen (Backend-Plan, Abschnitt 5):
//   online  Cover aus dem ISBN-Abruf  -> dessen tempId wird mitgeschickt
//   upload  eigenes Foto              -> tempId aus POST /api/covers/upload
//   none    kein Cover                -> keine tempId
// Fest gespeichert wird nur das gewählte Cover, und erst beim Speichern des Buchs.
//
// online: cover aus GET /api/isbn oder null
// cover:  { choice, upload, uploading, error } (State der Seite)
export default function CoverPicker({ online, cover, onChoose, onUpload }) {
    const fileInputRef = useRef(null)

    const options = [
        online && { value: 'online', label: `Online-Cover von ${sourceLabel(online.source)}` },
        cover.upload && { value: 'upload', label: 'Eigenes Bild' },
        { value: 'none', label: 'Kein Cover' },
    ].filter(Boolean)

    const previewUrl =
        cover.choice === 'online' ? online?.previewUrl
            : cover.choice === 'upload' ? cover.upload?.previewUrl
                : null

    function handleFileChange(event) {
        const file = event.target.files?.[0]
        // Zurücksetzen, damit dieselbe Datei nochmals gewählt werden kann
        event.target.value = ''
        if (file) onUpload(file)
    }

    return (
        <section className="side-card cover-picker" aria-labelledby="cover-picker-title">
            <h2 id="cover-picker-title" className="side-card-title">
                Cover
            </h2>

            <BookCover src={previewUrl} variant="preview" />

            {options.length > 1 && (
                <fieldset className="cover-choice">
                    <legend className="visually-hidden">Welches Cover speichern?</legend>
                    {options.map((option) => (
                        <label key={option.value} className="cover-choice-option">
                            <input
                                type="radio"
                                name="cover-choice"
                                value={option.value}
                                checked={cover.choice === option.value}
                                onChange={() => onChoose(option.value)}
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                </fieldset>
            )}

            <p className="side-card-text">{coverText(cover.choice, online)}</p>

            {cover.error && (
                <p className="cover-picker-error" role="alert">
                    {cover.error}
                </p>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleFileChange}
            />
            <button
                type="button"
                className="btn btn-secondary cover-picker-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={cover.uploading}
            >
                {cover.uploading ? 'Bild wird hochgeladen …' : cover.upload ? 'Anderes Bild hochladen' : 'Eigenes Bild hochladen'}
            </button>

            <p className="side-card-note">
                JPEG, PNG oder WebP, höchstens 10 MB. Wird auf 800 px Höhe verkleinert, als WebP gespeichert, dazu ein
                Thumbnail mit 150 px.
            </p>
        </section>
    )
}

function coverText(choice, online) {
    if (choice === 'online') {
        return `Von ${sourceLabel(online.source)} geholt. Wird beim Speichern als Datei abgelegt, nicht bei jedem Aufruf nachgeladen.`
    }
    if (choice === 'upload') {
        return 'Dein Foto. Wird beim Speichern übernommen.'
    }
    if (online) {
        return 'Das Buch wird ohne Cover gespeichert. Ein Bild lässt sich später ergänzen.'
    }
    return 'Noch kein Cover. Nach „Daten holen“ erscheint hier das Online-Cover, falls es eines gibt. Ein Foto vom Buchrücken genügt auch.'
}