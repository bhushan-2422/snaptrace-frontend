import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import EventPage from './pages/EventPage'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Register from './pages/Register'

function Protected({ children }) {
  const { user, booting } = useAuth()
  const location = useLocation()
  if (booting) {
    return (
      <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner" style={{ width: 26, height: 26 }} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function LandingOrDashboard() {
  const { user, booting } = useAuth()
  if (booting) return null
  return user ? <Navigate to="/dashboard" replace /> : <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingOrDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/events/:id"
          element={
            <Protected>
              <EventPage />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
