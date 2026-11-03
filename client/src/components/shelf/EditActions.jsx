import { Pencil, Trash2 } from 'lucide-react'
import './EditActions.css'

// Stift und Papierkorb im Bearbeiten-Modus der Übersicht
export default function EditActions({ name, onRename, onDelete }) {
    return (
        <span className="edit-actions">
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