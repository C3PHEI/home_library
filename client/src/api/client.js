// Kleiner fetch-Wrapper. Wirft ApiError mit der einheitlichen Fehlerform
// des Backends: { error: { code, message, fields } }

export class ApiError extends Error {
    constructor(status, code, message, fields = {}) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = code
        this.fields = fields
    }
}

export async function apiGet(path, { signal } = {}) {
    let response
    try {
        response = await fetch(`/api${path}`, {
            headers: { Accept: 'application/json' },
            signal,
        })
    } catch (err) {
        if (err.name === 'AbortError') throw err
        throw new ApiError(0, 'NETWORK', 'Server nicht erreichbar')
    }

    const body = await response.json().catch(() => null)

    if (!response.ok) {
        const error = body?.error ?? {}
        throw new ApiError(
            response.status,
            error.code ?? 'INTERNAL',
            error.message ?? `Fehler ${response.status}`,
            error.fields ?? {},
        )
    }

    return body
}