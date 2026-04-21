import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthContext'
import RequireAuth from '../components/auth/RequireAuth'
import LoginPage from '../components/auth/LoginPage'
import PortalPage from './PortalPage'
import AdminPage from './AdminPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><PortalPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth requireAdmin><AdminPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
