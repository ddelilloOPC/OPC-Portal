import { Link } from '../../types'
import styles from './LinkCard.module.css'

export default function LinkCard({ link }: { link: Link }) {
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={styles.card}>
      <h3 className={styles.title}>{link.title}</h3>
      {link.description && <p className={styles.description}>{link.description}</p>}
      <span className={styles.url}>{link.href}</span>
    </a>
  )
}
