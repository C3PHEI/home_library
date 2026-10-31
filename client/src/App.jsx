import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ShelfOverviewPage from './pages/ShelfOverviewPage.jsx'
import SlotPanel from './components/shelf/SlotPanel.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import AddBookIsbnPage from './pages/AddBookIsbnPage.jsx'
import AddBookManualPage from './pages/AddBookManualPage.jsx'

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
                <Route path="suche" element={<SearchPage />} />
                <Route path="erfassen" element={<AddBookIsbnPage />} />
                <Route path="erfassen/ohne-isbn" element={<AddBookManualPage />} />

                <Route path="*" element={<PlaceholderPage title="Seite nicht gefunden" />} />
            </Route>
        </Routes>
    )
}