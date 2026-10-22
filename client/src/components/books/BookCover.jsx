import { useState } from 'react'
import './BookCover.css'

// Cover-Vorschau. variant: 'tile' (Kachel, 168 px hoch), 'row' (Liste, 32 x 45 px)
// oder 'hit' (Suchtreffer, 54 x 76 px)
export default function BookCover({ src, variant = 'tile' }) {
    // Fehlt das Bild auf dem Server, wird auf den Platzhalter gewechselt
    const [failedSrc, setFailedSrc] = useState(null)
    const className = `book-cover book-cover-${variant}`

    if (src && failedSrc !== src) {
        return (
            <img
                className={className}
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setFailedSrc(src)}
            />
        )
    }

    return (
        <span className={`${className} book-cover-missing`} aria-hidden="true">
            {variant === 'tile' ? (
                <>
                    <PlusIcon />
                    <span>Cover fehlt</span>
                </>
            ) : (
                <BookIcon />
            )}
        </span>
    )
}

function PlusIcon() {
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
        </svg>
    )
}

function BookIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v18H5.5A1.5 1.5 0 0 1 4 19.5z" />
            <path d="M8 3v18" />
        </svg>
    )
}