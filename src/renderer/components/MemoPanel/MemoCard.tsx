import { useState } from 'react'
import type { Memo } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { MEMO_COLOR_HEX } from '../../utils/todoUtils'
import MemoEditModal from './MemoEditModal'
import styles from './MemoPanel.module.css'

export default function MemoCard({ memo }: { memo: Memo }): JSX.Element {
  const toggleMemoPinned = useAppStore((s) => s.toggleMemoPinned)
  const [editing, setEditing] = useState(false)

  return (
    <>
      <div
        className={styles.card}
        style={{ background: `${MEMO_COLOR_HEX[memo.color]}33`, borderColor: `${MEMO_COLOR_HEX[memo.color]}80` }}
        onClick={() => setEditing(true)}
      >
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>{memo.title || '无标题'}</span>
          <button
            className={`${styles.pinBtn} ${memo.pinned ? styles.pinBtnActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              toggleMemoPinned(memo.id)
            }}
            aria-label="置顶"
            title="置顶"
          >
            📌
          </button>
        </div>
        <p className={styles.cardContent}>{memo.content}</p>
        <div className={styles.cardFooter}>
          {memo.linkedDate && <span>{memo.linkedDate}</span>}
          {memo.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
      {editing && <MemoEditModal initial={memo} onClose={() => setEditing(false)} />}
    </>
  )
}
