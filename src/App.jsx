import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import MemberDashboard from './pages/MemberDashboard'
import Landing from './pages/Landing'
import HubAdmin from './pages/HubAdmin'
import ComfortSpot from './pages/ComfortSpot'

function SplashLoading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-canvas">
      <span className="label-caps">loading workspace…</span>
    </div>
  )
}

function Gate({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <SplashLoading />
  if (!session) return <Navigate to="/agency-hub/login" replace />
  return children
}

function RoleRouter() {
  const { profile, loading } = useAuth()
  if (loading || !profile) return <SplashLoading />
  if (profile.role === 'admin') return <AdminDashboard />
  return <MemberDashboard />
}

function AgencyHubRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route index element={<Gate><RoleRouter /></Gate>} />
      <Route path="*" element={<Gate><RoleRouter /></Gate>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/comfort-spot" element={<ComfortSpot />} />
        <Route path="/hub-admin" element={<HubAdmin />} />
        <Route path="/agency-hub/*" element={<AgencyHubRoutes />} />
      </Routes>
    </AuthProvider>
  )
}
