import { ATTEMPT_LABELS, SOURCES } from './sources.js'
import './LookupSources.css'

// Box "Abrufreihenfolge": welche Quelle was geantwortet hat (attempts aus GET /api/isbn).
// Kam das Ergebnis aus dem Zwischenspeicher, lässt es sich neu abfragen.
export default function LookupSources({ lookup, onRefresh }) {
    const result = lookup.status === 'done' ? lookup.result : null

    function statusFor(key) {
        if (lookup.status === 'loading') return { text: '…', tone: '' }
        const attempt = result?.attempts.find((a) => a.source === key)
        if (!attempt) return { text: '', tone: '' }
        return { text: ATTEMPT_LABELS[attempt.status] ?? attempt.status, tone: attempt.status }
    }

    return (
        <section className="side-card" aria-labelledby="lookup-sources-title">
            <h2 id="lookup-sources-title" className="side-card-title">
                Abrufreihenfolge
            </h2>

            <ol className="lookup-sources">
                {SOURCES.map((source, index) => {
                    const status = statusFor(source.key)
                    return (
                        <li key={source.key} className="lookup-source">
                            <span className="lookup-source-name">
                                <span className="lookup-source-number">{index + 1}</span>
                                {source.listLabel}
                            </span>
                            <span className={`lookup-source-status is-${status.tone || 'none'}`}>{status.text}</span>
                        </li>
                    )
                })}
                <li className="lookup-source">
                    <span className="lookup-source-name">
                        <span className="lookup-source-number">{SOURCES.length + 1}</span>
                        Manuelle Eingabe
                    </span>
                    <span className="lookup-source-status">immer möglich</span>
                </li>
            </ol>

            {result?.cached && (
                <div className="lookup-cached">
                    <span>Aus dem Zwischenspeicher vom {formatDate(result.fetchedAt)}.</span>
                    <button type="button" className="lookup-refresh" onClick={onRefresh}>
                        Neu abfragen
                    </button>
                </div>
            )}

            <p className="side-card-note">
                Der Abruf läuft über das Backend, damit Ergebnisse zwischengespeichert werden und die Limits der
                Anbieter eingehalten sind.
            </p>
        </section>
    )
}

// "2026-10-06T19:19:03.646Z" -> "6.10.2026"
function formatDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'früher' : date.toLocaleDateString('de-CH')
}