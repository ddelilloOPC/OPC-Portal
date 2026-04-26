import logo from '../../assets/img/logo.png'
import { useAuth } from '../../features/auth/AuthContext'
import { t } from '../../lib/i18n'
import styles from './Header.module.css'

export default function Header() {
  const { user, logout } = useAuth()
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>
          <img src={logo} alt="OPC" className={styles.logoImg} />
          <span className={styles.brandDivider} />
          <span className={styles.brandPortal}>Portal</span>
        </a>
        <div className={styles.actions}>
          {user && (
            <>
              {user.role === 'admin' && (
                <a href="/admin" className={styles.adminLink}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd" /></svg>
                  <span className={styles.adminLinkText}>{t('admin.manageLinks')}</span>
                </a>
              )}
              <span className={styles.userName}>{user.name}</span>
              <button className={styles.logoutBtn} onClick={logout}>{t('auth.signOut')}</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
