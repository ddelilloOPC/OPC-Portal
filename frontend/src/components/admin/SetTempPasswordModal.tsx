import { useState } from 'react'
import { ManagedUser } from '../../types'
import { api } from '../../lib/api/client'
import { t } from '../../lib/i18n'
import styles from '../admin/LinkForm.module.css'

interface Props {
  user: ManagedUser
  onDone: () => void
  onCancel: () => void
}

export default function SetTempPasswordModal({ user, onDone, onCancel }: Props) {
  const [form, setForm] = useState({ password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.post(`/api/admin/users/${user.id}/set-temp-password`, form)
      onDone()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h3 className={styles.heading}>{t('admin.setTempPasswordTitle')}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          {t('admin.setTempPasswordHint')} — <strong>{user.full_name}</strong> ({user.email})
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>{t('admin.tempPassword')} *</span>
            <input
              className={styles.input}
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t('admin.confirmTempPassword')} *</span>
            <input
              className={styles.input}
              type="password"
              value={form.confirm_password}
              onChange={set('confirm_password')}
              autoComplete="new-password"
              required
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>{t('admin.cancel')}</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
