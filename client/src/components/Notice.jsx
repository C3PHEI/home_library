import './Notice.css'

// Farbige Hinweisbox mit Symbol, Titelzeile und optionalem Text darunter.
// variant: 'success' (grün), 'caution' (gelb), 'info' (grau), 'error' (rot)
// role: 'status' für Rückmeldungen, 'alert' für Fehler
export default function Notice({ variant = 'info', title, children, action, role = 'status' }) {
    return (
        <div className={`notice notice-${variant}`} role={role}>
            <NoticeIcon variant={variant} />
            <div className="notice-body">
                <span className="notice-title">{title}</span>
                {children && <span className="notice-text">{children}</span>}
                {action && <div className="notice-action">{action}</div>}
            </div>
        </div>
    )
}

function NoticeIcon({ variant }) {
    return (
        <svg className="notice-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {variant === 'success' && <path d="M20 6 9 17l-5-5" />}
            {variant === 'caution' && (
                <>
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </>
            )}
            {(variant === 'info' || variant === 'accent' || variant === 'error') && (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d={variant === 'error' ? 'M12 7v6' : 'M12 11v5'} />
                    <path d={variant === 'error' ? 'M12 16.5h.01' : 'M12 8h.01'} />
                </>
            )}
        </svg>
    )
}