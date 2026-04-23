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
              <span className={styles.userName}>{user.name}</span>
              <button className={styles.logoutBtn} onClick={logout}>{t('auth.signOut')}</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
