import { useState, useRef, useEffect, useId } from 'react'
import { Link } from '../../types'
import { api } from '../../lib/api/client'
import { t } from '../../lib/i18n'
import styles from './LinkForm.module.css'

// ── Inline combobox for category ──────────────────────────────────────────────
function CategoryCombobox({
  value, onChange, suggestions, required,
}: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  required?: boolean
}) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = suggestions.filter(s =>
    s.toUpperCase().includes(value.trim().toUpperCase())
  )
  const isOpen = open && filtered.length > 0

  /** Normalize: if what was typed matches an existing category, use that spelling */
  const normalize = (raw: string) => {
    const trimmed = raw.trim()
    const match = suggestions.find(s => s.toUpperCase() === trimmed.toUpperCase())
    return match ?? trimmed.toUpperCase()
  }

  const select = (cat: string) => {
    onChange(cat)
    setOpen(false)
    setActiveIdx(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') { setOpen(true); setActiveIdx(0); e.preventDefault() }
      return
    }
    if (e.key === 'ArrowDown') { setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); e.preventDefault() }
    else if (e.key === 'ArrowUp') { setActiveIdx(i => Math.max(i - 1, 0)); e.preventDefault() }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); select(filtered[activeIdx]) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1) }
  }

  const handleBlur = (_: React.FocusEvent) => {
    // Delay to allow click on list item to register first
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setOpen(false)
        setActiveIdx(-1)
        onChange(normalize(value))
      }
    }, 120)
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIdx])

  return (
    <div className={styles.comboWrap}>
      <input
        ref={inputRef}
        id={id}
        className={styles.input}
        value={value}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
        onChange={e => { onChange(e.target.value); setOpen(true); setActiveIdx(-1) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={styles.comboList}
        >
          {filtered.map((cat, i) => (
            <li
              key={cat}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`${styles.comboItem}${i === activeIdx ? ' ' + styles.comboItemActive : ''}`}
              onMouseDown={e => { e.preventDefault(); select(cat) }}
            >
              {cat}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  link?: Link
  existingCategories?: string[]
  onSaved: () => void
  onCancel: () => void
}

type FormData = { title: string; description: string; href: string; category: string; order: number; isActive: boolean }

export default function LinkForm({ link, existingCategories = [], onSaved, onCancel }: Props) {
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
    const payload = { ...form, category: form.category.trim().toUpperCase() }
    try {
      if (isEdit && link) { await api.put(`/api/links/${link.id}`, payload) }
      else { await api.post('/api/links', payload) }
      onSaved()
    } catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}><span className={styles.label}>{t('links.title')} *</span><input className={styles.input} value={form.title} onChange={setField('title')} required /></label>
          <label className={styles.field}><span className={styles.label}>{t('links.description')}</span><textarea className={styles.input} value={form.description} onChange={setField('description')} rows={2} /></label>
          <label className={styles.field}><span className={styles.label}>{t('links.url')} *</span><input className={styles.input} type="url" value={form.href} onChange={setField('href')} required /></label>
          <div className={styles.field}><span className={styles.label}>{t('links.category')} *</span><CategoryCombobox value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} suggestions={existingCategories} required /></div>
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
