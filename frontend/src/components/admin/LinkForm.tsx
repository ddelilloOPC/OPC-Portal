import { useState } from 'react'
import { Link } from '../../types'
import { api } from '../../lib/api/client'
import { t } from '../../lib/i18n'
import styles from './LinkForm.module.css'

interface Props {
  link?: Link
  onSaved: () => void
  onCancel: () => void
}

type FormData = { title: string; description: string; href: string; category: string; order: number; isActive: boolean }

export default function LinkForm({ link, onSaved, onCancel }: Props) {
  const isEdit = Boolean(link)
  const [form, setForm] = useState<FormData>({
    title: link?.title ?? '', description: link?.description ?? '',
    href: link?.href ?? '', category: link?.category ?? '',
    order: link?.order ?? 0, isActive: link?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = field === 'order' ? Number(e.target.value) : field === 'isActive' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      if (isEdit && link) { await api.put(`/api/links/${link.id}`, form) }
      else { await api.post('/api/links', form) }
      onSaved()
    } catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h3 className={styles.heading}>{isEdit ? t('admin.editLink') : t('admin.newLink')}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}><span className={styles.label}>{t('links.title')} *</span><input className={styles.input} value={form.title} onChange={setField('title')} required /></label>
          <label className={styles.field}><span className={styles.label}>{t('links.description')}</span><textarea className={styles.input} value={form.description} onChange={setField('description')} rows={2} /></label>
          <label className={styles.field}><span className={styles.label}>{t('links.url')} *</span><input className={styles.input} type="url" value={form.href} onChange={setField('href')} required /></label>
          <label className={styles.field}><span className={styles.label}>{t('links.category')} *</span><input className={styles.input} value={form.category} onChange={setField('category')} required /></label>
          <label className={styles.field}><span className={styles.label}>{t('links.order')}</span><input className={styles.input} type="number" value={form.order} onChange={setField('order')} /></label>
          <label className={styles.checkboxField}><input type="checkbox" checked={form.isActive} onChange={setField('isActive')} /><span>{t('links.active')}</span></label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>{t('admin.cancel')}</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? t('admin.saving') : t('admin.save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
