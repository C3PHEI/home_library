import { Link } from 'react-router-dom'
import Notice from '../Notice.jsx'
import { joinGerman } from '../../utils/format.js'
import { hadSourceFailure, sourceLabel } from './sources.js'

// Rückmeldungen zum ISBN-Abruf unter dem ISBN-Feld:
// lädt, Fehler, Treffer, nicht gefunden und "steht schon im Bestand".
// lookup: { status: 'idle' | 'loading' | 'done' | 'error', result, error }
export default function LookupNotices({ lookup, onRetry }) {
    if (lookup.status === 'loading') {
        return (
            <Notice variant="info" title="Daten werden geholt …">
                Open Library, DNB und Google Books werden der Reihe nach gefragt. Das dauert ein paar Sekunden.
            </Notice>
        )
    }

    if (lookup.status === 'error') {
        return (
            <Notice
                variant="error"
                role="alert"
                title={`Der Abruf hat nicht geklappt: ${lookup.error.message}`}
                action={
                    <button type="button" className="btn btn-secondary" onClick={onRetry}>
                        Nochmals versuchen
                    </button>
                }
            >
                Die Angaben lassen sich auch von Hand eintragen.
            </Notice>
        )
    }

    if (lookup.status !== 'done') return null

    const { result } = lookup
    return (
        <>
            {result.found ? <FoundNotice result={result} /> : <NotFoundNotice result={result} />}
            {result.existing.length > 0 && <DuplicateNotice existing={result.existing} />}
        </>
    )
}

function FoundNotice({ result }) {
    // Quellen mit Treffer: die erste liefert die Daten, weitere ergänzen fehlende Felder
    const helpers = result.attempts
        .filter((attempt) => attempt.source !== result.source)
        .filter((attempt) => attempt.status === 'hit' || attempt.status === 'incomplete')
        .map((attempt) => sourceLabel(attempt.source))

    const title = helpers.length > 0
        ? `Treffer bei ${sourceLabel(result.source)}, ergänzt durch ${joinGerman(helpers)}`
        : `Treffer bei ${sourceLabel(result.source)}, Angaben übernommen`

    const missing = [!result.data.title && 'Titel', !result.data.author && 'Autor'].filter(Boolean)

    return (
        <Notice variant={missing.length > 0 ? 'caution' : 'success'} title={title}>
            {missing.length > 0 && `${joinGerman(missing)} ${missing.length === 1 ? 'fehlt' : 'fehlen'}, bitte selbst eintragen. `}
            Alle Felder unten sind frei änderbar.
            {result.data.publishedYear && ' Das Jahr gehört zu dieser Ausgabe, nicht zur Erstausgabe.'}
        </Notice>
    )
}

function NotFoundNotice({ result }) {
    // Keine Quelle hat geantwortet (z. B. Pi ohne Internet): das heisst nicht, dass es das Buch nicht gibt
    if (result.attempts.every((attempt) => attempt.status === 'timeout' || attempt.status === 'error')) {
        return (
            <Notice variant="caution" title="Die Quellen sind gerade nicht erreichbar">
                Später nochmals „Daten holen“ versuchen oder die Angaben selbst eintragen. Die ISBN wird mitgespeichert.
            </Notice>
        )
    }

    return (
        <Notice variant="caution" title="Keine Quelle kennt diese ISBN">
            {hadSourceFailure(result.attempts)
                ? 'Nicht alle Quellen waren erreichbar. Später nochmals „Daten holen“ versuchen oder die Angaben selbst eintragen.'
                : 'Titel, Autor und die übrigen Angaben bitte selbst eintragen. Die ISBN wird trotzdem gespeichert.'}
        </Notice>
    )
}

function DuplicateNotice({ existing }) {
    // Jeder Standort führt zum vorhandenen Exemplar
    const places = existing.map((copy, index) => (
        <span key={copy.bookId}>
            {index > 0 && (index === existing.length - 1 ? ' und ' : ', ')}
            <Link to={`/buecher/${copy.bookId}`}>{copy.location}</Link>
        </span>
    ))

    return (
        <Notice
            variant="caution"
            title={
                <>
                    Diese ISBN steht schon {existing.length > 1 ? `${existing.length}-mal ` : ''}im Bestand, in {places}
                </>
            }
        >
            Das ist kein Fehler. Speichern legt ein weiteres Exemplar an, das einen eigenen Standort bekommt.
        </Notice>
    )
}