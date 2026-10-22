import { formatCount } from '../../utils/format.js'
import { tabLabel } from './searchTabUtils.js'
import './SearchTabs.css'

// Leiste mit Filtern über den Treffern. Gefiltert wird in der Seite, nicht im Backend.
export default function SearchTabs({ tabs, activeTab, onChange }) {
    return (
        <div className="search-tabs" role="group" aria-label="Treffer filtern">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    className="search-tab"
                    aria-pressed={tab.key === activeTab}
                    onClick={() => onChange(tab.key)}
                >
                    {tabLabel(tab.key)}
                    <span className="search-tab-count">{formatCount(tab.count)}</span>
                </button>
            ))}
        </div>
    )
}