import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ShelfOverviewPage from './pages/ShelfOverviewPage.jsx'
import SlotPage from './pages/SlotPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import AddBookIsbnPage from './pages/AddBookIsbnPage.jsx'
import AddBookManualPage from './pages/AddBookManualPage.jsx'

export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<ShelfOverviewPage />} />
                {/* Ein Fach (Reihe, Ablage) als eigene Seite */}
                <Route path="regal/:slotId" element={<SlotPage />} />

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