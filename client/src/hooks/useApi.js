import { useCallback, useEffect, useState } from 'react'

// Laedt Daten beim ersten Rendern. reload() holt sie erneut.
// loader muss stabil sein (Funktion ausserhalb der Komponente oder useCallback).
export function useApi(loader) {
    const [state, setState] = useState({ data: null, error: null, loading: true })
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        const controller = new AbortController()

        loader({ signal: controller.signal })
            .then((data) => setState({ data, error: null, loading: false }))
            .catch((error) => {
                if (error.name === 'AbortError') return
                setState({ data: null, error, loading: false })
            })

        return () => controller.abort()
    }, [loader, attempt])

    const reload = useCallback(() => {
        setState((prev) => ({ ...prev, loading: true }))
        setAttempt((n) => n + 1)
    }, [])

    return { ...state, reload }
}