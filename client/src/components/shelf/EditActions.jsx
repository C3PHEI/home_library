import { Pencil, Plus, Trash2 } from 'lucide-react'
import './EditActions.css'

// Stift und Papierkorb im Bearbeiten-Modus der Übersicht.
// onAdd (nur bei Möbeln): zusätzlich ein Plus für ein neues Fach.
export default function EditActions({ name, onAdd, onRename, onDelete }) {
    return (
        <span className="edit-actions">
            {onAdd && (
                <button
                    type="button"
                    className="edit-btn"
                    onClick={onAdd}
                    title="Fach hinzufügen"
                    aria-label={`Fach zu ${name} hinzufügen`}
                >
                    <Plus size={16} aria-hidden="true" />
                </button>
            )}
            <button
                type="button"
                className="edit-btn"
                onClick={onRename}
                title="Umbenennen"
                aria-label={`${name} umbenennen`}
            >
                <Pencil size={15} aria-hidden="true" />
            </button>
            <button
                type="button"
                className="edit-btn edit-btn-danger"
                onClick={onDelete}
                title="Löschen"
                aria-label={`${name} löschen`}
            >
                <Trash2 size={15} aria-hidden="true" />
            </button>
        </span>
    )
}