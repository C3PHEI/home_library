// CSV für Excel (Windows): Semikolon als Trennzeichen, UTF-8 mit BOM, Zeilenende CRLF.

const BOM = '\uFEFF'

function escapeCell(value) {
    if (value === null || value === undefined) return ''

    let text = value instanceof Date ? value.toISOString() : String(value)

    // Schutz vor Formel-Einschleusung: Excel führt Zellen aus, die mit = + - @ beginnen
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
        text = "'" + text
    }

    // Zellen mit Trennzeichen, Anführungszeichen oder Zeilenumbruch in "" setzen
    if (/[;"\r\n]/.test(text)) {
        text = '"' + text.replace(/"/g, '""') + '"'
    }
    return text
}

// columns: [{ header: 'Titel', value: row => row.title }, ...]
export function toCsv(columns, rows) {
    const lines = [columns.map(c => escapeCell(c.header)).join(';')]
    for (const row of rows) {
        lines.push(columns.map(c => escapeCell(c.value(row))).join(';'))
    }
    return BOM + lines.join('\r\n') + '\r\n'
}