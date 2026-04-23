import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../lib/api/client'
import { t } from '../../lib/i18n'
import styles from './RegisterPage.module.css'

interface FieldErrors {
  full_name?: string
  email?: string
  password?: string
  confirm_password?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(err => ({ ...err, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    setSubmitting(true)
    try {
      await api.post('/auth/local/register', form)
      setSuccess(true)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      if (apiErr.status === 422 || apiErr.status === 409) {
        const body = apiErr.body as { errors?: FieldErrors }
        setErrors(body.errors ?? {})
      } else {
        setGlobalError(apiErr.message ?? t('errors.serverError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}><span className={styles.logoText}>OPC</span></div>
        <h1 className={styles.title}>{t('auth.registerTitle')}</h1>
        <p className={styles.subtitle}>{t('auth.registerSubtitle')}</p>

        {success ? (
          <div className={styles.success}>
            {t('auth.pendingMessage')}
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {globalError && <p className={styles.globalError}>{globalError}</p>}

            <div className={styles.field}>
              <label className={styles.label}>{t('auth.fullName')}</label>
              <input
                className={`${styles.input}${errors.full_name ? ' ' + styles.inputError : ''}`}
                type="text" value={form.full_name} onChange={set('full_name')}
                autoComplete="name" required
              />
              {errors.full_name && <span className={styles.fieldError}>{errors.full_name}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('auth.email')}</label>
              <input
                className={`${styles.input}${errors.email ? ' ' + styles.inputError : ''}`}
                type="email" value={form.email} onChange={set('email')}
                autoComplete="email" required
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('auth.password')}</label>
              <input
                className={`${styles.input}${errors.password ? ' ' + styles.inputError : ''}`}
                type="password" value={form.password} onChange={set('password')}
                autoComplete="new-password" required
              />
              {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('auth.confirmPassword')}</label>
              <input
                className={`${styles.input}${errors.confirm_password ? ' ' + styles.inputError : ''}`}
                type="password" value={form.confirm_password} onChange={set('confirm_password')}
                autoComplete="new-password" required
              />
              {errors.confirm_password && <span className={styles.fieldError}>{errors.confirm_password}</span>}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? t('admin.saving') : t('auth.register')}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <button className={styles.footerLink} onClick={() => navigate('/login')}>
            {t('auth.loginLink')}
          </button>
        </div>
      </div>
    </div>
  )
}
