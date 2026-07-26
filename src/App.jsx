import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import MemberDashboard from './pages/MemberDashboard'

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
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RoleRouter() {
  const { profile, loading } = useAuth()
  if (loading || !profile) return <SplashLoading />
  if (profile.role === 'admin') return <AdminDashboard />
  return <MemberDashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <Gate>
              <RoleRouter />
            </Gate>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
