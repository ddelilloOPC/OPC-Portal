import { useNavigate } from 'react-router-dom'
import { t } from '../../lib/i18n'
import styles from './PendingPage.module.css'

export default function PendingPage() {
  const navigate = useNavigate()
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}><span className={styles.logoText}>OPC</span></div>
        <h1 className={styles.title}>{t('auth.pendingTitle')}</h1>
        <p className={styles.message}>{t('auth.pendingMessage')}</p>
        <button className={styles.backLink} onClick={() => navigate('/login')}>
          {t('auth.backToLogin')}
        </button>
      </div>
    </div>
  )
}
