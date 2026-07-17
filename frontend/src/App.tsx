import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from './components/layout/HomePage'
import { AppShell } from './components/layout/AppShell'
import { NotFoundPage } from './components/layout/NotFoundPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { RoadmapPage } from './features/roadmap/RoadmapPage'
import { NotesPage } from './features/notes/NotesPage'
import { BookmarksPage } from './features/bookmarks/BookmarksPage'
import { SettingsPage } from './features/settings/SettingsPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
