import { useAuth } from '../../features/auth/AuthContext'
import { t } from '../../lib/i18n'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}><span className={styles.logoText}>OPC</span></div>
        <h1 className={styles.title}>{t('auth.welcome')}</h1>
        <p className={styles.subtitle}>{t('auth.subtitle')}</p>
        <button className={styles.loginButton} onClick={login}>
          <MicrosoftIcon />
          {t('auth.signIn')}
        </button>
      </div>
    </div>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
