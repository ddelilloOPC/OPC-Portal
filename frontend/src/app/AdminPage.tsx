import { useState } from 'react'
import Header from '../components/layout/Header'
import { useLinks } from '../features/links/useLinks'
import { useAuth } from '../features/auth/AuthContext'
import { t } from '../lib/i18n'
import { Link } from '../types'
import { api } from '../lib/api/client'
import LinkForm from '../components/admin/LinkForm'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const { user } = useAuth()
  const { links, loading, error, refresh } = useLinks()
  const [editing, setEditing] = useState<Link | null>(null)
  const [creating, setCreating] = useState(false)

  if (user?.role !== 'admin') {
    return <div><Header /><main className={styles.main}><p className={styles.unauthorized}>{t('errors.unauthorized')}</p></main></div>
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.confirmDelete'))) return
    await api.delete(`/api/links/${id}`)
    refresh()
  }

  const handleToggleActive = async (link: Link) => {
    await api.patch(`/api/links/${link.id}/status`, { isActive: !link.isActive })
    refresh()
  }

  const handleSaved = () => { setEditing(null); setCreating(false); refresh() }

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h2 className={styles.heading}>{t('admin.title')}</h2>
          <div className={styles.topActions}>
            <a href="/" className={styles.backLink}>{t('admin.backToPortal')}</a>
            <button className={styles.newBtn} onClick={() => { setCreating(true); setEditing(null) }}>+ {t('admin.newLink')}</button>
          </div>
        </div>
        {(creating || editing) && (
          <LinkForm link={editing ?? undefined} onSaved={handleSaved} onCancel={() => { setCreating(false); setEditing(null) }} />
        )}
        {loading && <p className={styles.state}>{t('common.loading')}</p>}
        {error && <p className={styles.stateError}>{error}</p>}
        {!loading && !error && links.length === 0 && <p className={styles.state}>{t('admin.noLinks')}</p>}
        {links.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>
                <th>{t('links.title')}</th><th>{t('links.category')}</th><th>{t('links.url')}</th>
                <th>{t('links.order')}</th><th>Status</th><th>{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {links.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order).map((link) => (
                  <tr key={link.id} className={!link.isActive ? styles.inactive : ''}>
                    <td>{link.title}</td>
                    <td>{link.category}</td>
                    <td className={styles.urlCell}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.href}</a></td>
                    <td>{link.order}</td>
                    <td><span className={link.isActive ? styles.badgeActive : styles.badgeInactive}>{link.isActive ? t('links.active') : t('links.inactive')}</span></td>
                    <td className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => { setEditing(link); setCreating(false) }}>{t('admin.editLink')}</button>
                      <button className={styles.actionBtn} onClick={() => handleToggleActive(link)}>{link.isActive ? t('admin.deactivate') : t('admin.activate')}</button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(link.id)}>{t('admin.deleteLink')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
