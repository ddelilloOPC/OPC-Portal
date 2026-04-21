import { useAuth } from '../../features/auth/AuthContext'
import { t } from '../../lib/i18n'
import styles from './Header.module.css'

export default function Header() {
  const { user, logout } = useAuth()
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>
          <span className={styles.brandBadge}>OPC</span>
          <span className={styles.brandName}>{t('portal.title')}</span>
        </a>
        <div className={styles.actions}>
          {user && (
            <>
              <span className={styles.userName}>{user.name}</span>
              <button className={styles.logoutBtn} onClick={logout}>{t('auth.signOut')}</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
