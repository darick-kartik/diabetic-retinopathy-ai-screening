import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '@/components/shared/Loading'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading label="Restoring your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
