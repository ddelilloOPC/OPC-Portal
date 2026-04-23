import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { api, ApiError } from '../../lib/api/client'
import { t } from '../../lib/i18n'
import logo from '../../assets/img/logo.png'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login, refresh } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/auth/local/login', form)
      await refresh()
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const e = err as ApiError
      if (e.status === 403 && e.message?.includes('pending')) {
        navigate('/pending', { replace: true })
      } else {
        setError(e.message ?? t('auth.error'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src={logo} alt="OPC" className={styles.logoImg} />

        <h1 className={styles.title}>{t('auth.welcome')}</h1>
        <p className={styles.subtitle}>{t('auth.subtitle')}</p>

        <form onSubmit={handleLocalLogin} className={styles.localForm} noValidate>
          {error && <p className={styles.localError}>{error}</p>}

          <input
            className={styles.localInput}
            type="email"
            placeholder={t('auth.email')}
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            required
          />

          <input
            className={styles.localInput}
            type="password"
            placeholder={t('auth.password')}
            value={form.password}
            onChange={set('password')}
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            className={styles.localBtn}
            disabled={submitting}
          >
            {submitting ? '...' : t('auth.signInLocal')}
          </button>
        </form>

        <div className={styles.divider}>
          <span>{t('auth.orSignInWithMicrosoft')}</span>
        </div>

        <button className={styles.loginButton} onClick={login}>
          <MicrosoftIcon />
          {t('auth.signIn')}
        </button>

        <p className={styles.registerHint}>
          <button
            className={styles.registerLink}
            onClick={() => navigate('/register')}
          >
            {t('auth.registerLink')}
          </button>
        </p>
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
