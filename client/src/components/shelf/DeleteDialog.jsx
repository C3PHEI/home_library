import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Dialog from '../Dialog.jsx'
import Field from '../form/Field.jsx'
import Notice from '../Notice.jsx'
import { deleteTarget } from '../../utils/structure.js'
import { findSlotPlace, slotOptionGroups } from '../../utils/location.js'
import { plural } from '../../utils/format.js'

// Raum, Möbelstück oder Fach löschen. Bücher werden nie gelöscht:
// stehen noch welche drin, wählt man ein Fach, in das sie umziehen.
// rooms: Baum aus GET /api/locations (für die Auswahl des Ziel-Fachs)
export default function DeleteDialog({ target, rooms, onClose, onDone }) {
    const [moveTo, setMoveTo] = useState('')
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    // Fächer, die mitgelöscht werden, kommen nicht als Ziel in Frage
    const groups = useMemo(
        () => slotOptionGroups(rooms, new Set(target.slotIds)),
        [rooms, target],
    )

    const hasBooks = target.bookCount > 0
    const noTargetLeft = hasBooks && groups.length === 0
    const canDelete = !busy && !noTargetLeft && (!hasBooks || moveTo !== '')

    async function handleDelete() {
        setBusy(true)
        setError(null)
        try {
            const result = await deleteTarget(target, hasBooks ? Number(moveTo) : null)
            let message = `«${target.name}» wurde gelöscht.`
            if (result?.movedBooks > 0) {
                const place = findSlotPlace(rooms, result.movedTo) ?? 'dem gewählten Fach'
                message += ` ${plural(result.movedBooks, 'Buch steht', 'Bücher stehen')} jetzt in ${place}.`
            }
            onDone(message)
        } catch (err) {
            setError(err.fields?.moveTo ? { field: err.fields.moveTo } : { general: err.message })
            setBusy(false)
        }
    }

    return (
        <Dialog
            title={`${target.noun} «${target.name}» löschen?`}
            description={`${describeContents(target)} Rückgängig machen geht nicht.`}
            icon={Trash2}
            tone="danger"
            busy={busy}
            onClose={onClose}
            actions={
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
                        Abbrechen
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={!canDelete}>
                        {busy ? 'Wird gelöscht …' : 'Endgültig löschen'}
                    </button>
                </>
            }
        >
            {!hasBooks && <Notice variant="info" title="Hier stehen keine Bücher." />}

            {noTargetLeft && (
                <Notice variant="error" role="alert" title={`Hier stehen noch ${plural(target.bookCount, 'Buch', 'Bücher')}.`}>
                    Es gibt kein anderes Fach, in das sie umziehen könnten. Zuerst ein anderes Fach
                    anlegen oder die Bücher einzeln verschieben.
                </Notice>
            )}

            {hasBooks && !noTargetLeft && (
                <>
                    <Notice variant="caution" title={`Hier stehen noch ${plural(target.bookCount, 'Buch', 'Bücher')}.`}>
                        Sie werden nicht gelöscht, sondern ziehen in das gewählte Fach um.
                    </Notice>

                    <Field id="delete-move-to" label="Bücher umziehen nach" error={error?.field}>
                        {(props) => (
                            <select
                                {...props}
                                className="select field-input"
                                value={moveTo}
                                disabled={busy}
                                onChange={(event) => {
                                    setMoveTo(event.target.value)
                                    setError(null)
                                }}
                            >
                                <option value="">Fach wählen …</option>
                                {groups.map((group) => (
                                    <optgroup key={group.room} label={group.room}>
                                        {group.options.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        )}
                    </Field>
                </>
            )}

            {error?.general && <Notice variant="error" role="alert" title={error.general} />}
        </Dialog>
    )
}

// Satz darüber, was alles mitgelöscht wird
function describeContents(target) {
    const slotCount = target.slotIds.length

    if (target.level === 'room') {
        return `Mit dem Raum werden ${plural(target.furnitureCount, 'Möbelstück', 'Möbelstücke')} und ${plural(slotCount, 'Fach', 'Fächer')} gelöscht.`
    }
    if (target.level === 'furniture') {
        if (slotCount === 0) return 'Es hat keine Fächer.'
        return `${plural(slotCount, 'Fach wird', 'Fächer werden')} mitgelöscht.`
    }
    return `Das Fach gehört zu «${target.furnitureName}».`
}