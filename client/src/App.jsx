import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ShelfOverviewPage from './pages/ShelfOverviewPage.jsx'
import SlotPanel from './components/shelf/SlotPanel.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'

export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                {/* Übersicht bleibt stehen, die Reihe öffnet als Unterroute daneben */}
                <Route element={<ShelfOverviewPage />}>
                    <Route index />
                    <Route path="regal/:slotId" element={<SlotPanel />} />
                </Route>

                <Route path="buecher" element={<PlaceholderPage title="Alle Bücher" />} />
                <Route path="buecher/:bookId" element={<PlaceholderPage title="Buchdetail" />} />
                <Route path="suche" element={<PlaceholderPage title="Suche" />} />
                <Route path="erfassen" element={<PlaceholderPage title="Buch erfassen" />} />

                <Route path="*" element={<PlaceholderPage title="Seite nicht gefunden" />} />
            </Route>
        </Routes>
    )
}