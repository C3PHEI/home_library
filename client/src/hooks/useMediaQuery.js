import { useCallback, useSyncExternalStore } from 'react'

// Gleiche Grenze wie in den CSS-Dateien (@media (max-width: 760px))
export const MOBILE_QUERY = '(max-width: 760px)'

export function useMediaQuery(query) {
    const subscribe = useCallback(
        (onChange) => {
            const mql = window.matchMedia(query)
            mql.addEventListener('change', onChange)
            return () => mql.removeEventListener('change', onChange)
        },
        [query],
    )

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}