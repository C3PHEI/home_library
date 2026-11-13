import { useState } from 'react'
import Dialog from '../Dialog.jsx'
import Field from '../form/Field.jsx'
import Notice from '../Notice.jsx'
import Segmented from '../Segmented.jsx'
import { createFurniture } from '../../api/locations.js'
import { FURNITURE_TYPES } from '../../utils/furniture.js'
import IconPicker from './IconPicker.jsx'
import { ROOM_ICONS, furnitureIconEntry, furnitureIconKey, roomIconKey } from '../../utils/icons.js'
import { plural } from '../../utils/format.js'
import './AddFurnitureDialog.css'

// Grenzen wie im Backend (structure.service.js)
const NAME_MAX_LENGTH = 60
const MAX_SLOTS = 40

// Wert im Raum-Dropdown für "Neuer Raum …"
const NEW_ROOM = '__new__'

const SLOT_MODES = [
    { value: 'count', label: 'Nach Anzahl' },
    { value: 'custom', label: 'Eigene Namen' },
]

// Neues Möbelstück mit seinen Fächern anlegen (Dialog aus dem neuen Mock).
// Der Raum ist ein bestehender oder ein neuer: ein neuer Raum entsteht
// zusammen mit seinem ersten Möbelstück.
// rooms: Baum aus GET /api/locations
// onDone(message, furnitureId) wird nach dem Speichern aufgerufen.
export default function AddFurnitureDialog({ rooms, onClose, onDone }) {
    // Möbel ohne Raum (key null) stehen unter "Ohne Raum": kein wählbarer Raum
    const roomNames = rooms.filter((room) => room.key !== null).map((room) => room.key)

    const [roomChoice, setRoomChoice] = useState(roomNames[0] ?? NEW_ROOM)
    const [newRoom, setNewRoom] = useState('')
    const [roomIcon, setRoomIcon] = useState(null)
    const [type, setType] = useState('shelf')
    const [name, setName] = useState('')
    const [mode, setMode] = useState('count')
    // null = noch nichts eingegeben, dann gilt der Vorschlag zur Art (Tisch: 1 Fach)
    const [count, setCount] = useState(null)
    const [names, setNames] = useState('')
    const [errors, setErrors] = useState({})
    const [busy, setBusy] = useState(false)

    const isNewRoom = roomChoice === NEW_ROOM
    const roomIconValue = roomIcon ?? roomIconKey({ room: newRoom, icon: null })
    const countValue = count ?? String(defaultCount(type))

    function clearError(field) {
        if (errors[field] || errors.general) setErrors({ ...errors, [field]: undefined, general: undefined })
    }

    async function handleSubmit(event) {
        event.preventDefault()

        const found = {}
        const room = isNewRoom ? clean(newRoom) : roomChoice
        const furnitureName = clean(name)
        if (room === '') found.room = 'Bitte einen Namen für den Raum eingeben'
        if (furnitureName === '') found.name = 'Bitte einen Namen eingeben'

        const data = { room, type, name: furnitureName }
        if (isNewRoom) data.roomIcon = roomIconValue
        if (mode === 'count') {
            const number = Number(countValue)
            if (countValue.trim() === '' || !Number.isInteger(number) || number < 1 || number > MAX_SLOTS) {
                found.slotCount = `Eine Zahl von 1 bis ${MAX_SLOTS} eingeben`
            }
            data.slotCount = number
        } else {
            const labels = parseLabels(names)
            const double = findDouble(labels)
            if (labels.length === 0) found.slotLabels = 'Mindestens einen Namen eingeben'
            else if (labels.length > MAX_SLOTS) found.slotLabels = `Höchstens ${MAX_SLOTS} Fächer`
            else if (double) found.slotLabels = `«${double}» kommt mehrmals vor`
            data.slotLabels = labels
        }

        if (Object.keys(found).length > 0) {
            setErrors(found)
            return
        }

        setBusy(true)
        setErrors({})
        try {
            const created = await createFurniture(data)
            const slots = plural(created.slots.length, 'Fach', 'Fächern')
            onDone(`«${created.name}» steht jetzt im Raum «${created.room}», mit ${slots}.`, created.id)
        } catch (err) {
            // Feldfehler: room, type, name, slotCount, slotLabels
            const fields = err.fields ?? {}
            setErrors(Object.keys(fields).length > 0 ? fields : { general: err.message })
            setBusy(false)
        }
    }

    return (
        <Dialog
            title="Möbelstück hinzufügen"
            description="Ordne es einem Raum zu und lege gleich die Fächer an."
            // Der Kreis oben zeigt das Symbol zur gewählten Art
            icon={furnitureIconEntry(furnitureIconKey({ type })).Icon}
            busy={busy}
            onClose={onClose}
            onSubmit={handleSubmit}
            actions={
                <>
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
                        Abbrechen
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? 'Wird gespeichert …' : 'Möbelstück speichern'}
                    </button>
                </>
            }
        >
            <div className="add-furniture-grid">
                {roomNames.length > 0 && (
                    <Field id="add-furniture-room" label="Raum" error={isNewRoom ? undefined : errors.room}>
                        {(props) => (
                            <select
                                {...props}
                                className="select field-input"
                                value={roomChoice}
                                disabled={busy}
                                onChange={(event) => {
                                    setRoomChoice(event.target.value)
                                    clearError('room')
                                }}
                            >
                                {roomNames.map((room) => (
                                    <option key={room} value={room}>
                                        {room}
                                    </option>
                                ))}
                                <option value={NEW_ROOM}>Neuer Raum …</option>
                            </select>
                        )}
                    </Field>
                )}

                <Field id="add-furniture-type" label="Art des Möbelstücks" error={errors.type}>
                    {(props) => (
                        <select
                            {...props}
                            className="select field-input"
                            value={type}
                            disabled={busy}
                            onChange={(event) => {
                                setType(event.target.value)
                                clearError('type')
                            }}
                        >
                            {FURNITURE_TYPES.map((entry) => (
                                <option key={entry.value} value={entry.value}>
                                    {entry.label}
                                </option>
                            ))}
                        </select>
                    )}
                </Field>

                {isNewRoom && (
                    <Field id="add-furniture-new-room" label="Name des neuen Raums" error={errors.room} wide>
                        {(props) => (
                            <input
                                {...props}
                                className="input field-input"
                                type="text"
                                value={newRoom}
                                maxLength={NAME_MAX_LENGTH}
                                placeholder="Zum Beispiel: Flur"
                                autoComplete="off"
                                disabled={busy}
                                onChange={(event) => {
                                    setNewRoom(event.target.value)
                                    clearError('room')
                                }}
                            />
                        )}
                    </Field>
                )}

                {isNewRoom && (
                    <div className="field-wide">
                        <IconPicker
                            icons={ROOM_ICONS}
                            value={roomIconValue}
                            onChange={setRoomIcon}
                            disabled={busy}
                            label="Symbol des neuen Raums"
                        />
                    </div>
                )}

                <Field id="add-furniture-name" label="Name des Möbelstücks" error={errors.name} wide>
                    {(props) => (
                        <input
                            {...props}
                            className="input field-input"
                            type="text"
                            value={name}
                            maxLength={NAME_MAX_LENGTH}
                            placeholder="Zum Beispiel: Schrank im Flur"
                            autoComplete="off"
                            disabled={busy}
                            onChange={(event) => {
                                setName(event.target.value)
                                clearError('name')
                            }}
                        />
                    )}
                </Field>
            </div>

            <div className="add-furniture-slots">
                <div className="add-furniture-slots-head">
                    <span className="field-label">Fächer anlegen</span>
                    <Segmented label="Fächer anlegen" options={SLOT_MODES} value={mode} onChange={setMode} />
                </div>

                {mode === 'count' ? (
                    <Field
                        id="add-furniture-count"
                        label="Anzahl der Fächer"
                        error={errors.slotCount}
                        hint={countHint(countValue)}
                    >
                        {(props) => (
                            <input
                                {...props}
                                className="input field-input add-furniture-count"
                                type="number"
                                inputMode="numeric"
                                min="1"
                                max={MAX_SLOTS}
                                value={countValue}
                                disabled={busy}
                                onChange={(event) => {
                                    setCount(event.target.value)
                                    clearError('slotCount')
                                }}
                            />
                        )}
                    </Field>
                ) : (
                    <Field
                        id="add-furniture-names"
                        label="Namen der Fächer"
                        error={errors.slotLabels}
                        hint="Je eine Zeile oder durch Komma getrennt, von oben nach unten."
                    >
                        {(props) => (
                            <textarea
                                {...props}
                                className="input field-input"
                                rows={4}
                                value={names}
                                placeholder={'Zum Beispiel:\nOben\nMitte\nUnten'}
                                disabled={busy}
                                onChange={(event) => {
                                    setNames(event.target.value)
                                    clearError('slotLabels')
                                }}
                            />
                        )}
                    </Field>
                )}
            </div>

            {errors.general && <Notice variant="error" role="alert" title={errors.general} />}
        </Dialog>
    )
}

// Leerzeichen am Rand weg, mehrere Leerzeichen zu einem (wie im Backend)
function clean(value) {
    return value.trim().replace(/\s+/g, ' ')
}

// Tische und Nachttische haben meist nur eine Ablage
function defaultCount(type) {
    return type === 'table' || type === 'nightstand' ? 1 : 4
}

// So nennt das Backend die Fächer bei "Nach Anzahl"
function countHint(value) {
    const number = Number(value)
    if (!Number.isInteger(number) || number < 1 || number > MAX_SLOTS) return undefined
    if (number === 1) return 'Das Fach heisst «Ablage». Umbenennen geht später jederzeit.'
    return `Die Fächer heissen «Fach 1» bis «Fach ${number}». Umbenennen geht später jederzeit.`
}

// "Oben\nMitte, Unten" -> ['Oben', 'Mitte', 'Unten']
function parseLabels(text) {
    return text.split(/[\n,;]/).map(clean).filter((label) => label !== '')
}

// Erster Name, der zweimal vorkommt (Gross/klein egal), sonst null
function findDouble(labels) {
    const seen = new Set()
    for (const label of labels) {
        const key = label.toLowerCase()
        if (seen.has(key)) return label
        seen.add(key)
    }
    return null
}