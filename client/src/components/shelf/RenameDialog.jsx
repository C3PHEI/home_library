import { useState } from 'react'
import { Pencil } from 'lucide-react'
import Dialog from '../Dialog.jsx'
import Field from '../form/Field.jsx'
import IconPicker from './IconPicker.jsx'
import { renameTarget } from '../../utils/structure.js'
import { FURNITURE_ICONS, ROOM_ICONS, furnitureIconEntry, roomIconEntry } from '../../utils/icons.js'

const NAME_MAX_LENGTH = 60 // wie im Backend (structure.service.js)

// Welche Icons es bei welcher Ebene gibt. Fächer haben kein Icon.
const ICONS_BY_LEVEL = {
    room: { icons: ROOM_ICONS, entry: roomIconEntry },
    furniture: { icons: FURNITURE_ICONS, entry: furnitureIconEntry },
}

// Fach umbenennen. Bei Raum und Möbel zusätzlich das Icon wählen:
// beim Raum nur Raum-Icons, beim Möbel nur Möbel-Icons.
// onDone(message) wird nach dem Speichern aufgerufen.
export default function RenameDialog({ target, onClose, onDone }) {
    const iconSet = ICONS_BY_LEVEL[target.level] ?? null

    const [name, setName] = useState(target.name)
    const [icon, setIcon] = useState(target.icon ?? null)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        const newName = name.trim().replace(/\s+/g, ' ')

        if (newName === '') {
            setError('Bitte einen Namen eingeben')
            return
        }

        const nameChanged = newName !== target.name
        const iconChanged = iconSet !== null && icon !== target.icon
        if (!nameChanged && !iconChanged) {
            onClose()
            return
        }

        setBusy(true)
        setError(null)
        try {
            await renameTarget(target, newName, icon)
            onDone(doneMessage(target.name, newName, nameChanged, iconChanged))
        } catch (err) {
            // Feldfehler kommen als fields.name (Raum, Möbel), fields.label (Fach) oder fields.icon
            setError(err.fields?.name ?? err.fields?.label ?? err.fields?.icon ?? err.message)
            setBusy(false)
        }
    }

    return (
        <Dialog
            title={iconSet ? `${target.noun} bearbeiten` : `${target.noun} umbenennen`}
            description={target.level === 'slot' ? `Fach in «${target.furnitureName}»` : undefined}
            // Bei Raum und Möbel zeigt der Kreis oben gleich das gewählte Icon
            icon={iconSet ? iconSet.entry(icon).Icon : Pencil}
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
            <Field id="rename-name" label={iconSet ? 'Name' : 'Neuer Name'} error={error}>
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

            {iconSet && <IconPicker icons={iconSet.icons} value={icon} onChange={setIcon} disabled={busy} />}
        </Dialog>
    )
}

function doneMessage(oldName, newName, nameChanged, iconChanged) {
    if (nameChanged && iconChanged) return `«${oldName}» heisst jetzt «${newName}» und hat ein neues Symbol.`
    if (nameChanged) return `«${oldName}» heisst jetzt «${newName}».`
    return `«${oldName}» hat ein neues Symbol.`
}