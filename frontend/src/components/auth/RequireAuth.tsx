import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { t } from '../../lib/i18n'

interface Props {
  children: ReactNode
  requireAdmin?: boolean
}

export default function RequireAuth({ children, requireAdmin }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p style={{ padding: '3rem', textAlign: 'center' }}>{t('common.loading')}</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
  if (requireAdmin && user.role !== 'admin') {
    return <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-danger)' }}>{t('errors.unauthorized')}</p>
  }
  return <>{children}</>
}
