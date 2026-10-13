import { useEffect, useState } from 'react'
import './App.css'

function App() {
    const [health, setHealth] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch('/api/health')
            .then(async (res) => {
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`)
                return data
            })
            .then(setHealth)
            .catch((err) => setError(err.message))
    }, []) // [] = nur einmal beim Laden

    return (
        <div>
            <h1>Meine Bibliothek</h1>

            {!health && !error && <p>Prüfe Backend…</p>}
            {health && <p style={{ color: 'green' }}>✅ Backend und Datenbank erreichbar ({health.status})</p>}
            {error && <p style={{ color: 'red' }}>❌ Fehler: {error}</p>}
        </div>
    )
}

export default App