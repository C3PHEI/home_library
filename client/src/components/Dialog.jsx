import { useEffect, useId, useRef } from 'react'
import './Dialog.css'

// Modales Fenster mit dem nativen <dialog>: der Fokus bleibt im Fenster,
// Esc schliesst es (ausser während busy).
//   title, description  Kopf
//   icon                Lucide-Icon im Kreis links
//   tone                'default' (grün) oder 'danger' (rot)
//   onSubmit            wenn gesetzt, ist der Inhalt ein <form> (Enter schickt ab)
//   actions             Buttons unten rechts
export default function Dialog({
                                   title,
                                   description,
                                   icon: Icon,
                                   tone = 'default',
                                   busy = false,
                                   onClose,
                                   onSubmit,
                                   actions,
                                   children,
                               }) {
    const ref = useRef(null)
    const titleId = useId()

    // Kein Schliessen im Aufräumen: das Entfernen aus dem DOM beendet den Dialog.
    useEffect(() => {
        const dialog = ref.current
        if (!dialog.open) dialog.showModal()
    }, [])

    function handleCancel(event) {
        if (busy) event.preventDefault()
    }

    const Body = onSubmit ? 'form' : 'div'
    const bodyProps = onSubmit ? { onSubmit, noValidate: true } : {}

    return (
        <dialog
            ref={ref}
            className={`dialog dialog-${tone}`}
            aria-labelledby={titleId}
            onCancel={handleCancel}
            onClose={onClose}
        >
            <Body className="dialog-body" {...bodyProps}>
                <div className="dialog-head">
                    {Icon && (
                        <span className="dialog-icon" aria-hidden="true">
                            <Icon size={21} />
                        </span>
                    )}
                    <div className="dialog-head-text">
                        <h2 id={titleId} className="dialog-title">{title}</h2>
                        {description && <p className="dialog-text">{description}</p>}
                    </div>
                </div>

                {children}

                {actions && <div className="dialog-actions">{actions}</div>}
            </Body>
        </dialog>
    )
}