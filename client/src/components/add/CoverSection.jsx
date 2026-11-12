import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import BookCover from '../books/BookCover.jsx'
import { COVER_TYPES } from '../../utils/bookForm.js'
import { sourceLabel } from './sources.js'
import './CoverSection.css'

// Abschnitt "Cover" beim Hinzufügen: Vorschau, Auswahl und eigenes Bild.
// Gewählt wird zwischen (Backend-Plan, Abschnitt 5):
//   online  Cover aus dem ISBN-Abruf  -> dessen tempId wird mitgeschickt
//   upload  eigenes Foto              -> tempId aus POST /api/covers/upload
//   none    kein Cover                -> keine tempId
//   current nur beim Bearbeiten: das gespeicherte Cover bleibt
// Fest gespeichert wird nur das gewählte Cover, und erst beim Speichern des Buchs.
//
// online:   cover aus GET /api/isbn oder null
// cover:    { choice, upload, uploading, error } (State der Seite)
// onChoose: (choice) => void
// onUpload: (file) => void
// current:  beim Bearbeiten das gespeicherte Cover { previewUrl } (Auswahl "Bisheriges Cover")
// withLookup: true bei "Mit ISBN beginnen" (Hinweis auf das Online-Cover)
export default function CoverSection({ online, current, cover, onChoose, onUpload, withLookup }) {
    const fileInputRef = useRef(null)
    const [dragging, setDragging] = useState(false)

    const options = [
        current && { value: 'current', label: 'Bisheriges Cover' },
        online && { value: 'online', label: `Online-Cover von ${sourceLabel(online.source)}` },
        cover.upload && { value: 'upload', label: 'Eigenes Bild' },
        { value: 'none', label: 'Ohne Cover' },
    ].filter(Boolean)

    const previewUrl =
        cover.choice === 'current' ? current?.previewUrl
            : cover.choice === 'online' ? online?.previewUrl
                : cover.choice === 'upload' ? cover.upload?.previewUrl
                    : null

    function handleFileChange(event) {
        const file = event.target.files?.[0]
        // Zurücksetzen, damit dieselbe Datei nochmals gewählt werden kann
        event.target.value = ''
        if (file) onUpload(file)
    }

    function handleDragOver(event) {
        // Nur Dateien annehmen, keinen markierten Text
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        if (!dragging) setDragging(true)
    }

    function handleDrop(event) {
        event.preventDefault()
        setDragging(false)
        if (cover.uploading) return
        const file = event.dataTransfer.files?.[0]
        if (file) onUpload(file)
    }

    return (
        <div className="cover-section">
            <BookCover src={previewUrl} variant="pick" />

            <div className="cover-section-main">
                <fieldset className="cover-choice">
                    <legend className="visually-hidden">Welches Cover speichern?</legend>
                    {options.map((option) => (
                        <label key={option.value} className="cover-chip">
                            <input
                                type="radio"
                                name="cover-choice"
                                className="visually-hidden"
                                value={option.value}
                                checked={cover.choice === option.value}
                                onChange={() => onChoose(option.value)}
                            />
                            {option.label}
                        </label>
                    ))}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={COVER_TYPES.join(',')}
                        className="visually-hidden"
                        tabIndex={-1}
                        aria-hidden="true"
                        onChange={handleFileChange}
                    />
                    <button
                        type="button"
                        className={dragging ? 'cover-drop is-dragging' : 'cover-drop'}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        disabled={cover.uploading}
                    >
                        <ImagePlus size={15} aria-hidden="true" />
                        {cover.uploading
                            ? 'Bild wird hochgeladen …'
                            : cover.upload
                                ? 'Anderes Bild wählen'
                                : 'Eigenes Bild wählen'}
                    </button>
                </fieldset>

                <p className="cover-section-text">{coverText(cover.choice, online, withLookup, current)}</p>

                {cover.error && (
                    <p className="cover-section-error" role="alert">
                        {cover.error}
                    </p>
                )}
            </div>
        </div>
    )
}

function coverText(choice, online, withLookup, current) {
    if (choice === 'current') {
        return 'Das Cover bleibt, wie es ist.'
    }
    if (current && choice === 'none') {
        return 'Das bisherige Cover wird beim Speichern entfernt.'
    }
    if (choice === 'online') {
        return `Von ${sourceLabel(online.source)} geholt. Wird beim Speichern übernommen.`
    }
    if (choice === 'upload') {
        return 'Dein Foto. Wird beim Speichern übernommen.'
    }
    if (withLookup && !online) {
        return 'Nach „Daten holen“ erscheint hier das Online-Cover, falls es eines gibt. Ein eigenes Foto geht auch (JPEG, PNG oder WebP, höchstens 10 MB).'
    }
    return 'Das Buch wird ohne Cover gespeichert. Ein Foto lässt sich jetzt wählen (JPEG, PNG oder WebP, höchstens 10 MB) oder später ergänzen.'
}