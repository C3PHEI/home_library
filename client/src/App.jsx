import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ShelfOverviewPage from './pages/ShelfOverviewPage.jsx'
import SlotPage from './pages/SlotPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import AddBookPage from './pages/AddBookPage.jsx'
import AllBooksPage from './pages/AllBooksPage.jsx'
import BookDetailPage from './pages/BookDetailPage.jsx'

export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<ShelfOverviewPage />} />
                {/* Ein Fach (Reihe, Ablage) als eigene Seite */}
                <Route path="regal/:slotId" element={<SlotPage />} />

                <Route path="buecher" element={<AllBooksPage />} />
                <Route path="buecher/:bookId" element={<BookDetailPage />} />
                <Route path="suche" element={<SearchPage />} />
                {/* /erfassen = mit ISBN, /erfassen/ohne-isbn = manuell. Eine Route,
                    damit die Eingaben beim Umschalten stehen bleiben. */}
                <Route path="erfassen/:mode?" element={<AddBookPage />} />

                <Route path="*" element={<PlaceholderPage title="Seite nicht gefunden" />} />
            </Route>
        </Routes>
    )
}