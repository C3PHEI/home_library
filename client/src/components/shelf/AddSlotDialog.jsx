import { useState } from 'react'
import { Plus } from 'lucide-react'
import Dialog from '../Dialog.jsx'
import Field from '../form/Field.jsx'
import { createSlot } from '../../api/slots.js'

const NAME_MAX_LENGTH = 60 // wie im Backend (structure.service.js)

// Einem bestehenden Möbelstück ein weiteres Fach geben. Es kommt ans Ende.
// furniture: Möbel aus GET /api/locations ({ id, name, slots })
// onDone(message, furnitureId) wird nach dem Speichern aufgerufen.
export default function AddSlotDialog({ furniture, onClose, onDone }) {
    const [label, setLabel] = useState(() => suggestLabel(furniture.slots))
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        const newLabel = label.trim().replace(/\s+/g, ' ')

        if (newLabel === '') {
            setError('Bitte einen Namen eingeben')
            return
        }
        if (furniture.slots.some((slot) => slot.label.toLowerCase() === newLabel.toLowerCase())) {
            setError('Ein anderes Fach in diesem Möbel heisst schon so')
            return
        }

        setBusy(true)
        setError(null)
        try {
            await createSlot(furniture.id, newLabel)
            onDone(`«${newLabel}» ist jetzt ein Fach in «${furniture.name}».`, furniture.id)
        } catch (err) {
            setError(err.fields?.label ?? err.message)
            setBusy(false)
        }
    }

    return (
        <Dialog
            title="Fach hinzufügen"
            description={`Neues Fach in «${furniture.name}»`}
            icon={Plus}
            busy={busy}
            onClose={onClose}
            onSubmit={handleSubmit}
            actions={
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
                        Abbrechen
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? 'Wird gespeichert …' : 'Fach speichern'}
                    </button>
                </>
            }
        >
            <Field id="add-slot-label" label="Name des Fachs" error={error}>
                {(props) => (
                    <input
                        {...props}
                        className="input field-input"
                        type="text"
                        value={label}
                        maxLength={NAME_MAX_LENGTH}
                        placeholder="Zum Beispiel: Unten"
                        autoComplete="off"
                        autoFocus
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => {
                            setLabel(event.target.value)
                            if (error) setError(null)
                        }}
                    />
                )}
            </Field>
        </Dialog>
    )
}

// Vorschlag für den Namen: nach "Reihe 6" kommt "Reihe 7".
// Endet das letzte Fach nicht auf eine Zahl ("Unten"), bleibt das Feld leer.
function suggestLabel(slots) {
    const match = slots.at(-1)?.label.match(/^(.*?)(\d+)$/)
    if (!match) return ''

    const taken = new Set(slots.map((slot) => slot.label.toLowerCase()))
    let number = Number(match[2]) + 1
    while (taken.has(`${match[1]}${number}`.toLowerCase())) number++
    return `${match[1]}${number}`
}