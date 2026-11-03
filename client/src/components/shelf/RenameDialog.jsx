import { useState } from 'react'
import { Pencil } from 'lucide-react'
import Dialog from '../Dialog.jsx'
import Field from '../form/Field.jsx'
import { renameTarget } from '../../utils/structure.js'

const NAME_MAX_LENGTH = 60 // wie im Backend (structure.service.js)

// Raum, Möbelstück oder Fach umbenennen.
// onDone(message) wird nach dem Speichern aufgerufen.
export default function RenameDialog({ target, onClose, onDone }) {
    const [name, setName] = useState(target.name)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        const newName = name.trim().replace(/\s+/g, ' ')

        if (newName === '') {
            setError('Bitte einen Namen eingeben')
            return
        }
        if (newName === target.name) {
            onClose()
            return
        }

        setBusy(true)
        setError(null)
        try {
            await renameTarget(target, newName)
            onDone(`«${target.name}» heisst jetzt «${newName}».`)
        } catch (err) {
            // Feldfehler kommen als fields.name (Raum, Möbel) oder fields.label (Fach)
            setError(err.fields?.name ?? err.fields?.label ?? err.message)
            setBusy(false)
        }
    }

    return (
        <Dialog
            title={`${target.noun} umbenennen`}
            description={target.level === 'slot' ? `Fach in «${target.furnitureName}»` : undefined}
            icon={Pencil}
            busy={busy}
            onClose={onClose}
            onSubmit={handleSubmit}
            actions={
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
                        Abbrechen
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? 'Wird gespeichert …' : 'Speichern'}
                    </button>
                </>
            }
        >
            <Field id="rename-name" label="Neuer Name" error={error}>
                {(props) => (
                    <input
                        {...props}
                        className="input field-input"
                        type="text"
                        value={name}
                        maxLength={NAME_MAX_LENGTH}
                        autoComplete="off"
                        autoFocus
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => {
                            setName(event.target.value)
                            if (error) setError(null)
                        }}
                    />
                )}
            </Field>
        </Dialog>
    )
}