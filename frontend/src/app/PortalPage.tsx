import Header from '../components/layout/Header'
import LinkCard from '../components/ui/LinkCard'
import { useLinks } from '../features/links/useLinks'
import { t } from '../lib/i18n'
import { Link } from '../types'
import styles from './PortalPage.module.css'

export default function PortalPage() {
  const { links, loading, error } = useLinks()
  const activeLinks = links.filter((l) => l.isActive)
  const normCat = (c: string) => (c || 'Other').trim().toUpperCase()
  const byCategory = activeLinks.reduce<Record<string, Link[]>>((acc, link) => {
    const cat = normCat(link.category)
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(link)
    return acc
  }, {})

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h2 className={styles.heading}>{t('portal.title')}</h2>
            <p className={styles.subheading}>{t('portal.subtitle')}</p>
          </div>
        </div>
        {loading && <p className={styles.state}>{t('portal.loading')}</p>}
        {error && <p className={styles.stateError}>{error}</p>}
        {!loading && !error && Object.keys(byCategory).length === 0 && (
          <p className={styles.state}>{t('portal.noLinks')}</p>
        )}
        {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, catLinks]) => (
          <section key={category} className={styles.section}>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <div className={styles.grid}>
              {catLinks.sort((a, b) => a.order - b.order).map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
