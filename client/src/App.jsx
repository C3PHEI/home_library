import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ShelfOverviewPage from './pages/ShelfOverviewPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'

export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<ShelfOverviewPage />} />

                <Route path="regal/:slotId" element={<PlaceholderPage title="Reihe" />} />
                <Route path="buecher" element={<PlaceholderPage title="Alle Bücher" />} />
                <Route path="buecher/:bookId" element={<PlaceholderPage title="Buchdetail" />} />
                <Route path="suche" element={<PlaceholderPage title="Suche" />} />
                <Route path="erfassen" element={<PlaceholderPage title="Buch erfassen" />} />

                <Route path="*" element={<PlaceholderPage title="Seite nicht gefunden" />} />
            </Route>
        </Routes>
    )
}