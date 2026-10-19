import { useCallback, useEffect, useState } from 'react'

// Laedt Daten, sobald sich loader aendert. reload() holt sie erneut.
// loader muss stabil sein (Funktion ausserhalb der Komponente oder useCallback).
// Waehrend neu geladen wird, bleiben die letzten Daten stehen und loading ist true.
export function useApi(loader) {
    const [attempt, setAttempt] = useState(0)
    const [state, setState] = useState({ data: null, error: null, loader: null, attempt: -1 })

    useEffect(() => {
        const controller = new AbortController()

        loader({ signal: controller.signal })
            .then((data) => setState({ data, error: null, loader, attempt }))
            .catch((error) => {
                if (error.name === 'AbortError') return
                setState({ data: null, error, loader, attempt })
            })

        return () => controller.abort()
    }, [loader, attempt])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    // Das Ergebnis gehoert noch zu einem frueheren loader oder Versuch
    const loading = state.loader !== loader || state.attempt !== attempt

    return {
        data: state.data,
        error: loading ? null : state.error,
        loading,
        reload,
    }
}