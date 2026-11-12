import { ATTEMPT_LABELS, SOURCES } from './sources.js'
import './LookupSources.css'

// Zeile "Abrufreihenfolge" unter dem ISBN-Feld: welche Quelle was geantwortet hat
// (attempts aus GET /api/isbn). Kam das Ergebnis aus dem Zwischenspeicher,
// lässt es sich neu abfragen.
export default function LookupSources({ lookup, onRefresh }) {
    const result = lookup.status === 'done' ? lookup.result : null

    function statusFor(key) {
        if (lookup.status === 'loading') return { text: '…', tone: '' }
        const attempt = result?.attempts.find((a) => a.source === key)
        if (!attempt) return { text: '', tone: '' }
        return { text: ATTEMPT_LABELS[attempt.status] ?? attempt.status, tone: attempt.status }
    }

    return (
        <div className="lookup-box">
            <span id="lookup-sources-title" className="lookup-box-title">
                Abrufreihenfolge
            </span>

            <ol className="lookup-sources" aria-labelledby="lookup-sources-title">
                {SOURCES.map((source, index) => {
                    const status = statusFor(source.key)
                    return (
                        <li key={source.key} className="lookup-source">
                            <span className="lookup-source-number" aria-hidden="true">
                                {index + 1}
                            </span>
                            <span className="lookup-source-name">{source.label}</span>
                            {status.text && (
                                <span className={`lookup-source-status is-${status.tone || 'none'}`}>{status.text}</span>
                            )}
                        </li>
                    )
                })}
            </ol>

            {result?.cached && (
                <div className="lookup-cached">
                    <span>Schon einmal abgefragt am {formatDate(result.fetchedAt)}.</span>
                    <button type="button" className="lookup-refresh" onClick={onRefresh}>
                        Neu abfragen
                    </button>
                </div>
            )}
        </div>
    )
}

// "2026-10-06T19:19:03.646Z" -> "6.10.2026"
function formatDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'früher' : date.toLocaleDateString('de-CH')
}