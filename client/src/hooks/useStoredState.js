import { useCallback, useState } from 'react'

// Wie useState, merkt sich den Wert aber im Browser (localStorage).
// Im privaten Fenster oder bei gesperrtem Speicher gilt einfach der Startwert.
export function useStoredState(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const raw = window.localStorage.getItem(key)
            return raw === null ? initialValue : JSON.parse(raw)
        } catch {
            return initialValue
        }
    })

    const setStoredValue = useCallback(
        (next) => {
            setValue(next)
            try {
                window.localStorage.setItem(key, JSON.stringify(next))
            } catch {
                // Speichern ist nur Komfort
            }
        },
        [key],
    )

    return [value, setStoredValue]
}