import { useState, useMemo } from 'react'
import Header from '../components/layout/Header'
import { useLinks } from '../features/links/useLinks'
import { useUsers } from '../features/users/useUsers'
import { useAuth } from '../features/auth/AuthContext'
import { t } from '../lib/i18n'
import { Link, ManagedUser } from '../types'
import { api } from '../lib/api/client'
import LinkForm from '../components/admin/LinkForm'
import SetTempPasswordModal from '../components/admin/SetTempPasswordModal'
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal'
import styles from './AdminPage.module.css'

type Tab = 'links' | 'users'

const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65z" />
    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
  </svg>
)
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5z" clipRule="evenodd" />
  </svg>
)
const IcoEye = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" clipRule="evenodd" />
  </svg>
)
const IcoEyeOff = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557z" clipRule="evenodd" />
    <path d="M10.748 13.93l2.523 2.523a10.003 10.003 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678z" />
  </svg>
)
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143z" clipRule="evenodd" />
  </svg>
)
const IcoX = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
)
const IcoKey = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M8 7a5 5 0 1 1 3.61 4.804l-1.903 1.903A1 1 0 0 1 9 14H8v1a1 1 0 0 1-1 1H6v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 .293-.707L7.196 10.39A5.002 5.002 0 0 1 8 7zm5-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" clipRule="evenodd" />
  </svg>
)
const IcoMicrosoft = () => (
  <svg width="12" height="12" viewBox="0 0 21 21" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
)

export default function AdminPage() {
  const { user, refresh: refreshAuth } = useAuth()
  const { links, loading: linksLoading, error: linksError, refresh: refreshLinks } = useLinks()
  const { users, loading: usersLoading, error: usersError, refresh: refreshUsers } = useUsers()
  const [tab, setTab] = useState<Tab>('links')
  const [editing, setEditing] = useState<Link | null>(null)
  const [creating, setCreating] = useState(false)
  const [settingTempPw, setSettingTempPw] = useState<ManagedUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Link | null>(null)

  // Links filters
  const [linkSearch, setLinkSearch] = useState('')
  const [linkStatusFilter, setLinkStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [linkCategoryFilter, setLinkCategoryFilter] = useState('all')

  // Users filters
  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [userProviderFilter, setUserProviderFilter] = useState<'all' | 'local' | 'microsoft'>('all')

  if (user?.role !== 'admin') {
    return <div><Header /><main className={styles.main}><p className={styles.unauthorized}>{t('errors.unauthorized')}</p></main></div>
  }

  const handleDelete = (link: Link) => { setDeleteTarget(link) }
  const executeDelete = async () => {
    if (!deleteTarget) return
    await api.delete(`/api/links/${deleteTarget.id}`)
    setDeleteTarget(null)
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
    // Re-fetch the current user's profile so that self-demotion is reflected
    // immediately: the early-return check below will then render access denied.
    await refreshAuth()
  }

  const statusBadge = (status: ManagedUser['status']) => {
    const cls = status === 'approved' ? styles.badgeActive : status === 'pending' ? styles.badgePending : styles.badgeInactive
    const label = t(`admin.status${status.charAt(0).toUpperCase() + status.slice(1)}` as Parameters<typeof t>[0])
    return <span className={cls}>{label}</span>
  }

  const providerBadge = (provider: ManagedUser['auth_provider']) => {
    if (provider === 'microsoft') {
      return <span className={styles.badgeMicrosoft}><IcoMicrosoft />{t('admin.providerMicrosoft')}</span>
    }
    return <span className={styles.badgeLocal}>{t('admin.providerLocal')}</span>
  }

  const existingCategories = useMemo(() =>
    Array.from(new Set(links.map(l => (l.category || '').trim().toUpperCase()).filter(Boolean))).sort(),
    [links]
  )

  const filteredLinks = useMemo(() => {
    const q = linkSearch.trim().toLowerCase()
    return links
      .filter(l => {
        if (q && !l.title.toLowerCase().includes(q) && !l.category.toLowerCase().includes(q) && !l.href.toLowerCase().includes(q)) return false
        if (linkStatusFilter === 'active' && !l.isActive) return false
        if (linkStatusFilter === 'inactive' && l.isActive) return false
        if (linkCategoryFilter !== 'all' && (l.category || '').trim().toUpperCase() !== linkCategoryFilter) return false
        return true
      })
      .sort((a, b) => (a.category || '').trim().toUpperCase().localeCompare((b.category || '').trim().toUpperCase()) || a.order - b.order)
  }, [links, linkSearch, linkStatusFilter, linkCategoryFilter])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return users.filter(u => {
      if (q && !u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false
      if (userProviderFilter !== 'all' && u.auth_provider !== userProviderFilter) return false
      return true
    })
  }, [users, userSearch, userStatusFilter, userRoleFilter, userProviderFilter])

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
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>{editing ? t('admin.editLink') : t('admin.newLink')}</span>
                </div>
                <LinkForm link={editing ?? undefined} existingCategories={existingCategories} onSaved={handleSaved} onCancel={() => { setCreating(false); setEditing(null) }} />
              </div>
            )}
            {linksLoading && <p className={styles.state}>{t('common.loading')}</p>}
            {linksError && <p className={styles.stateError}>{linksError}</p>}
            {!linksLoading && !linksError && (
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>{t('admin.tabLinks')}</span>
                  <span className={styles.sectionCount}>{filteredLinks.length}/{links.length}</span>
                </div>
                <div className={styles.filterBar}>
                  <input
                    className={styles.filterInput}
                    type="search"
                    placeholder={t('admin.filterSearchLinks')}
                    value={linkSearch}
                    onChange={e => setLinkSearch(e.target.value)}
                  />
                  <select className={styles.filterSelect} value={linkStatusFilter} onChange={e => setLinkStatusFilter(e.target.value as typeof linkStatusFilter)}>
                    <option value="all">{t('admin.filterAllStatuses')}</option>
                    <option value="active">{t('links.active')}</option>
                    <option value="inactive">{t('links.inactive')}</option>
                  </select>
                  <select className={styles.filterSelect} value={linkCategoryFilter} onChange={e => setLinkCategoryFilter(e.target.value)}>
                    <option value="all">{t('admin.filterAllCategories')}</option>
                    {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {filteredLinks.length === 0 ? (
                  <p className={styles.state}>{links.length === 0 ? t('admin.noLinks') : t('admin.noFilterResults')}</p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr>
                        <th>{t('links.title')}</th><th>{t('links.category')}</th><th>{t('links.url')}</th>
                        <th className={styles.colCenter}>{t('links.order')}</th><th>Status</th><th className={styles.thRight}>{t('common.actions')}</th>
                      </tr></thead>
                      <tbody>
                        {filteredLinks.map((link) => (
                          <tr key={link.id} className={!link.isActive ? styles.inactive : ''}>
                            <td data-label="Title">{link.title}</td>
                            <td data-label="Category">{link.category}</td>
                            <td data-label="URL" className={styles.urlCell}><a href={link.href} target="_blank" rel="noopener noreferrer" title={link.href}>{link.href}</a></td>
                            <td data-label="Order" className={styles.colCenter}>{link.order}</td>
                            <td data-label="Status"><span className={link.isActive ? styles.badgeActive : styles.badgeInactive}>{link.isActive ? t('links.active') : t('links.inactive')}</span></td>
                            <td data-label="Actions" className={styles.actions}>
                              <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => { setEditing(link); setCreating(false) }}><IcoEdit />{t('admin.editLink')}</button>
                              <button className={`${styles.actionBtn} ${styles.toggleBtn}`} onClick={() => handleToggleActive(link)}>{link.isActive ? <><IcoEyeOff />{t('admin.deactivate')}</> : <><IcoEye />{t('admin.activate')}</>}</button>
                              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(link)}><IcoTrash />{t('admin.deleteLink')}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
            {!usersLoading && !usersError && (
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>{t('admin.tabUsers')}</span>
                  <span className={styles.sectionCount}>{filteredUsers.length}/{users.length}</span>
                </div>
                <div className={styles.filterBar}>
                  <input
                    className={styles.filterInput}
                    type="search"
                    placeholder={t('admin.filterSearchUsers')}
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                  <select className={styles.filterSelect} value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value as typeof userStatusFilter)}>
                    <option value="all">{t('admin.filterAllStatuses')}</option>
                    <option value="pending">{t('admin.statusPending')}</option>
                    <option value="approved">{t('admin.statusApproved')}</option>
                    <option value="rejected">{t('admin.statusRejected')}</option>
                  </select>
                  <select className={styles.filterSelect} value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value as typeof userRoleFilter)}>
                    <option value="all">{t('admin.filterAllRoles')}</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                  <select className={styles.filterSelect} value={userProviderFilter} onChange={e => setUserProviderFilter(e.target.value as typeof userProviderFilter)}>
                    <option value="all">{t('admin.filterAllProviders')}</option>
                    <option value="local">{t('admin.providerLocal')}</option>
                    <option value="microsoft">{t('admin.providerMicrosoft')}</option>
                  </select>
                </div>
                {filteredUsers.length === 0 ? (
                  <p className={styles.state}>{users.length === 0 ? t('admin.noUsers') : t('admin.noFilterResults')}</p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={`${styles.table} ${styles.usersTable}`}>
                      <thead><tr>
                        <th>{t('admin.userName')}</th><th>{t('admin.userEmail')}</th>
                        <th>{t('admin.userProvider')}</th><th>{t('admin.userStatus')}</th>
                        <th>{t('admin.userRole')}</th><th>{t('admin.userRegistered')}</th>
                        <th className={styles.thRight}>{t('common.actions')}</th>
                      </tr></thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id}>
                            <td data-label="Name">{u.full_name}</td>
                            <td data-label="Email">{u.email}</td>
                            <td data-label="Provider">{providerBadge(u.auth_provider)}</td>
                            <td data-label="Status">{statusBadge(u.status)}</td>
                            <td data-label="Role">
                              <select
                                className={styles.roleSelect}
                                value={u.role}
                                onChange={e => handleRoleChange(u, e.target.value)}
                              >
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                            <td data-label="Registered">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td data-label="Actions" className={styles.actions}>
                              {u.status !== 'approved' && (
                                <button className={`${styles.actionBtn} ${styles.approveBtn}`} onClick={() => handleApprove(u)}><IcoCheck />{t('admin.approve')}</button>
                              )}
                              {u.status !== 'rejected' && (
                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleReject(u)}><IcoX />{t('admin.reject')}</button>
                              )}
                              {u.auth_provider === 'local' && u.status === 'approved' && (
                                <button className={`${styles.actionBtn} ${styles.tempPwBtn}`} onClick={() => setSettingTempPw(u)}><IcoKey />{t('admin.setTempPassword')}</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            itemName={deleteTarget.title}
            onConfirm={executeDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </main>
    </div>
  )
}
