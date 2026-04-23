import { useState } from 'react'
import Header from '../components/layout/Header'
import { useLinks } from '../features/links/useLinks'
import { useUsers } from '../features/users/useUsers'
import { useAuth } from '../features/auth/AuthContext'
import { t } from '../lib/i18n'
import { Link, ManagedUser } from '../types'
import { api } from '../lib/api/client'
import LinkForm from '../components/admin/LinkForm'
import SetTempPasswordModal from '../components/admin/SetTempPasswordModal'
import styles from './AdminPage.module.css'

type Tab = 'links' | 'users'

export default function AdminPage() {
  const { user } = useAuth()
  const { links, loading: linksLoading, error: linksError, refresh: refreshLinks } = useLinks()
  const { users, loading: usersLoading, error: usersError, refresh: refreshUsers } = useUsers()
  const [tab, setTab] = useState<Tab>('links')
  const [editing, setEditing] = useState<Link | null>(null)
  const [creating, setCreating] = useState(false)
  const [settingTempPw, setSettingTempPw] = useState<ManagedUser | null>(null)

  if (user?.role !== 'admin') {
    return <div><Header /><main className={styles.main}><p className={styles.unauthorized}>{t('errors.unauthorized')}</p></main></div>
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.confirmDelete'))) return
    await api.delete(`/api/links/${id}`)
    refreshLinks()
  }

  const handleToggleActive = async (link: Link) => {
    await api.patch(`/api/links/${link.id}/status`, { isActive: !link.isActive })
    refreshLinks()
  }

  const handleSaved = () => { setEditing(null); setCreating(false); refreshLinks() }

  const handleApprove = async (u: ManagedUser) => {
    await api.post(`/api/admin/users/${u.id}/approve`, {})
    refreshUsers()
  }

  const handleReject = async (u: ManagedUser) => {
    if (!window.confirm(t('admin.confirmReject'))) return
    await api.post(`/api/admin/users/${u.id}/reject`, {})
    refreshUsers()
  }

  const handleRoleChange = async (u: ManagedUser, role: string) => {
    await api.patch(`/api/admin/users/${u.id}`, { role })
    refreshUsers()
  }

  const statusBadge = (status: ManagedUser['status']) => {
    const cls = status === 'approved' ? styles.badgeActive : status === 'pending' ? styles.badgePending : styles.badgeInactive
    const label = t(`admin.status${status.charAt(0).toUpperCase() + status.slice(1)}` as Parameters<typeof t>[0])
    return <span className={cls}>{label}</span>
  }

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h2 className={styles.heading}>{t('admin.title')}</h2>
          <div className={styles.topActions}>
            <a href="/" className={styles.backLink}>{t('admin.backToPortal')}</a>
            {tab === 'links' && (
              <button className={styles.newBtn} onClick={() => { setCreating(true); setEditing(null) }}>+ {t('admin.newLink')}</button>
            )}
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab}${tab === 'links' ? ' ' + styles.tabActive : ''}`} onClick={() => setTab('links')}>{t('admin.tabLinks')}</button>
          <button className={`${styles.tab}${tab === 'users' ? ' ' + styles.tabActive : ''}`} onClick={() => setTab('users')}>{t('admin.tabUsers')}</button>
        </div>

        {tab === 'links' && (
          <>
            {(creating || editing) && (
              <LinkForm link={editing ?? undefined} onSaved={handleSaved} onCancel={() => { setCreating(false); setEditing(null) }} />
            )}
            {linksLoading && <p className={styles.state}>{t('common.loading')}</p>}
            {linksError && <p className={styles.stateError}>{linksError}</p>}
            {!linksLoading && !linksError && links.length === 0 && <p className={styles.state}>{t('admin.noLinks')}</p>}
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
          </>
        )}

        {tab === 'users' && (
          <>
            {settingTempPw && (
              <SetTempPasswordModal
                user={settingTempPw}
                onDone={() => { setSettingTempPw(null); refreshUsers() }}
                onCancel={() => setSettingTempPw(null)}
              />
            )}
            {usersLoading && <p className={styles.state}>{t('common.loading')}</p>}
            {usersError && <p className={styles.stateError}>{usersError}</p>}
            {!usersLoading && !usersError && users.length === 0 && <p className={styles.state}>{t('admin.noUsers')}</p>}
            {users.length > 0 && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr>
                    <th>{t('admin.userName')}</th><th>{t('admin.userEmail')}</th>
                    <th>{t('admin.userStatus')}</th><th>{t('admin.userRole')}</th>
                    <th>{t('admin.userRegistered')}</th><th>{t('common.actions')}</th>
                  </tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.full_name}</td>
                        <td>{u.email}</td>
                        <td>{statusBadge(u.status)}</td>
                        <td>
                          <select
                            className={styles.roleSelect}
                            value={u.role}
                            onChange={e => handleRoleChange(u, e.target.value)}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className={styles.actions}>
                          {u.status !== 'approved' && (
                            <button className={styles.actionBtn} onClick={() => handleApprove(u)}>{t('admin.approve')}</button>
                          )}
                          {u.status !== 'rejected' && (
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleReject(u)}>{t('admin.reject')}</button>
                          )}
                          {u.auth_provider === 'local' && u.status === 'approved' && (
                            <button className={styles.actionBtn} onClick={() => setSettingTempPw(u)}>{t('admin.setTempPassword')}</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
