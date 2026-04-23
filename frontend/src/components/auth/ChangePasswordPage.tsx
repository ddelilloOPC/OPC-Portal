import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { api, ApiError } from '../../lib/api/client'
import { t } from '../../lib/i18n'
import styles from './LoginPage.module.css'

export default function ChangePasswordPage() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.post('/auth/local/change-password', form)
      await refresh()
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError((err as ApiError).message ?? t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}><span className={styles.logoText}>OPC</span></div>
        <h1 className={styles.title}>{t('changePassword.title')}</h1>
        <p className={styles.subtitle}>{t('changePassword.subtitle')}</p>
        <form onSubmit={handleSubmit} className={styles.localForm} noValidate>
          {error && <p className={styles.localError}>{error}</p>}
          <input
            className={styles.localInput}
            type="password"
            placeholder={t('changePassword.currentPassword')}
            value={form.current_password}
            onChange={set('current_password')}
            autoComplete="current-password"
            required
          />
          <input
            className={styles.localInput}
            type="password"
            placeholder={t('changePassword.newPassword')}
            value={form.new_password}
            onChange={set('new_password')}
            autoComplete="new-password"
            required
          />
          <input
            className={styles.localInput}
            type="password"
            placeholder={t('changePassword.confirmPassword')}
            value={form.confirm_password}
            onChange={set('confirm_password')}
            autoComplete="new-password"
            required
          />
          <button type="submit" className={styles.localBtn} disabled={submitting}>
            {submitting ? t('changePassword.submitting') : t('changePassword.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
