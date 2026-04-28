import { ReactNode } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { t } from '../../lib/i18n'

interface Props {
  children: ReactNode
  requireAdmin?: boolean
}

function UnauthorizedPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1rem', background: 'var(--color-bg, #f2f5f8)' }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ed', borderRadius: '16px', boxShadow: '0 4px 24px rgba(28,61,110,0.10)', padding: '3rem 2.5rem 2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '68px', height: '68px', borderRadius: '50%', background: '#fde8e9', color: '#c5282c', marginBottom: '1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18233c', marginBottom: '0.625rem', letterSpacing: '-0.02em' }}>{t('errors.accessDenied')}</h2>
        <p style={{ fontSize: '0.9375rem', color: '#506078', lineHeight: 1.6, marginBottom: '2rem' }}>{t('errors.adminOnly')}</p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #2354a0 0%, #1c3d6e 100%)', color: '#fff', borderRadius: '10px', padding: '0.5625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(28,61,110,0.22)' }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10z" clipRule="evenodd" /></svg>
          {t('admin.returnHome')}
        </Link>
      </div>
    </div>
  )
}

function RejectedPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1rem', background: 'var(--color-bg, #f2f5f8)' }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ed', borderRadius: '16px', boxShadow: '0 4px 24px rgba(28,61,110,0.10)', padding: '3rem 2.5rem 2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '68px', height: '68px', borderRadius: '50%', background: '#fde8e9', color: '#c5282c', marginBottom: '1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18233c', marginBottom: '0.625rem', letterSpacing: '-0.02em' }}>{t('auth.rejectedTitle')}</h2>
        <p style={{ fontSize: '0.9375rem', color: '#506078', lineHeight: 1.6, marginBottom: '2rem' }}>{t('auth.rejectedMessage')}</p>
        <a href="/auth/logout" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #2354a0 0%, #1c3d6e 100%)', color: '#fff', borderRadius: '10px', padding: '0.5625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(28,61,110,0.22)' }}>
          {t('auth.signOut')}
        </a>
      </div>
    </div>
  )
}

export default function RequireAuth({ children, requireAdmin }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p style={{ padding: '3rem', textAlign: 'center' }}>{t('common.loading')}</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (user.status === 'rejected') return <RejectedPage />
  if (user.status === 'pending') return <Navigate to="/pending" replace />
  if (requireAdmin && user.role !== 'admin') {
    return <UnauthorizedPage />
  }
  return <>{children}</>
}
