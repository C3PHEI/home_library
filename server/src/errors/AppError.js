// Eigene Fehlerklassen (wie eigene Exceptions in C#)
export class AppError extends Error {
    constructor(status, code, message, fields) {
        super(message)
        this.status = status
        this.code = code
        this.fields = fields
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Nicht gefunden') {
        super(404, 'NOT_FOUND', message)
    }
}

export class ValidationError extends AppError {
    constructor(fields, message = 'Eingaben ungültig') {
        super(400, 'VALIDATION', message, fields)
    }
}