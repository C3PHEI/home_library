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

// 409: Anfrage passt nicht zum aktuellen Stand (Name schon vergeben,
// im Fach stehen noch Bücher ...)
export class ConflictError extends AppError {
    constructor(message, fields, code = 'CONFLICT') {
        super(409, code, message, fields)
    }
}