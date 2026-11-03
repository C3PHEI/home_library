import './PageHead.css'

// Seitenkopf wie im neuen Mock:
//   eyebrow  kleine Zeile über dem Titel ("WILLKOMMEN DAHEIM")
//   title    Seitentitel (h1)
//   lead     Satz unter dem Titel
//   actions  Buttons rechts, auf dem Handy unter dem Titel
export default function PageHead({ eyebrow, title, lead, actions }) {
    return (
        <header className="page-head">
            <div className="page-head-text">
                {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                <h1 className="page-title">{title}</h1>
                {lead && <p className="page-lead">{lead}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
        </header>
    )
}