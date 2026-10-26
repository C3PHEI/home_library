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

export function apiGet(path, { signal } = {}) {
    return request(path, { signal })
}

// POST, PUT, PATCH, DELETE mit JSON-Body
export function apiSend(method, path, body, { signal } = {}) {
    return request(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
    })
}

// Datei-Upload (multipart/form-data). Den Content-Type setzt der Browser
// selbst, weil er die Grenze (boundary) zwischen den Teilen festlegt.
export function apiUpload(path, formData, { signal } = {}) {
    return request(path, { method: 'POST', body: formData, signal })
}

async function request(path, { method = 'GET', headers = {}, body, signal } = {}) {
    let response
    try {
        response = await fetch(`/api${path}`, {
            method,
            headers: { Accept: 'application/json', ...headers },
            body,
            signal,
        })
    } catch (err) {
        if (err.name === 'AbortError') throw err
        throw new ApiError(0, 'NETWORK', 'Server nicht erreichbar')
    }

    // 204 No Content (z. B. DELETE): kein Body
    if (response.status === 204) return null

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        const error = data?.error ?? {}
        throw new ApiError(
            response.status,
            error.code ?? 'INTERNAL',
            error.message ?? `Fehler ${response.status}`,
            error.fields ?? {},
        )
    }

    return data
}