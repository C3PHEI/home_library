import { useRef, useState } from 'react'
import BookCover from '../books/BookCover.jsx'
import { COVER_TYPES } from '../../utils/bookForm.js'
import './CoverUpload.css'

// Cover-Box für "Erfassen ohne ISBN" (Erfassen-Manuell.html): nur eigenes Bild, kein Online-Cover.
// Bild hineinziehen oder auswählen -> POST /api/covers/upload -> tempId.
// Fest gespeichert wird es erst, wenn das Buch gespeichert wird.
//
// cover:    { upload, uploading, error } (State der Seite, wie beim CoverPicker)
// onUpload: (file) => void
// onRemove: () => void
export default function CoverUpload({ cover, onUpload, onRemove }) {
    const fileInputRef = useRef(null)
    const [dragging, setDragging] = useState(false)
    const previewUrl = cover.upload?.previewUrl

    function pickFile() {
        fileInputRef.current?.click()
    }

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

    function handleDragLeave(event) {
        // dragleave feuert auch beim Wechsel auf ein Kind-Element
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
    }

    function handleDrop(event) {
        event.preventDefault()
        setDragging(false)
        if (cover.uploading) return
        const file = event.dataTransfer.files?.[0]
        if (file) onUpload(file)
    }

    const zoneClass = ['cover-drop', dragging && 'is-dragging', previewUrl && 'has-image'].filter(Boolean).join(' ')

    return (
        <section className="side-card cover-upload" aria-labelledby="cover-upload-title">
            <h2 id="cover-upload-title" className="side-card-title">
                Cover hochladen
            </h2>

            <div
                className={zoneClass}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                aria-busy={cover.uploading}
            >
                {previewUrl ? (
                    <BookCover src={previewUrl} variant="preview" />
                ) : (
                    <button type="button" className="cover-drop-empty" onClick={pickFile} disabled={cover.uploading}>
                        <UploadIcon />
                        <span>
                            {cover.uploading
                                ? 'Bild wird hochgeladen …'
                                : 'Bild hierher ziehen oder auswählen. Ein Foto vom Buchrücken genügt.'}
                        </span>
                    </button>
                )}
                {previewUrl && cover.uploading && <span className="cover-drop-busy">Bild wird hochgeladen …</span>}
            </div>

            {cover.error && (
                <p className="cover-upload-error" role="alert">
                    {cover.error}
                </p>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={COVER_TYPES.join(',')}
                className="visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleFileChange}
            />

            <div className="cover-upload-actions">
                <button type="button" className="btn btn-secondary" onClick={pickFile} disabled={cover.uploading}>
                    {previewUrl ? 'Anderes Bild wählen' : 'Bild auswählen'}
                </button>
                {previewUrl && (
                    <button
                        type="button"
                        className="btn btn-secondary cover-upload-remove"
                        onClick={onRemove}
                        disabled={cover.uploading}
                    >
                        Entfernen
                    </button>
                )}
            </div>

            <p className="side-card-note">
                JPEG, PNG oder WebP, höchstens 10 MB. Wird auf 800 px Höhe verkleinert, als WebP gespeichert, dazu ein
                Thumbnail mit 150 px.
            </p>
        </section>
    )
}

function UploadIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
    )
}