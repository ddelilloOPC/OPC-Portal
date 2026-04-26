import styles from './DeleteConfirmModal.module.css'
import { t } from '../../lib/i18n'

interface Props {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmModal({ itemName, onConfirm, onCancel }: Props) {
  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-heading"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className={styles.dialog}>
        <div className={styles.iconWrap} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h3 id="delete-modal-heading" className={styles.heading}>{t('admin.deleteLink')}</h3>
        <p className={styles.body}>
          {t('admin.confirmDelete')}
          <br />
          <strong className={styles.itemName}>{itemName}</strong>
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            {t('admin.cancel')}
          </button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
            {t('admin.deleteLink')}
          </button>
        </div>
      </div>
    </div>
  )
}
