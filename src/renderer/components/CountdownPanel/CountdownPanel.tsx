import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getCountdownDisplay, sortCountdowns } from '../../utils/countdownUtils'
import CountdownEditModal from './CountdownEditModal'
import styles from './CountdownPanel.module.css'

export default function CountdownPanel(): JSX.Element {
  const countdowns = useAppStore((s) => s.countdowns)
  const [editingId, setEditingId] = useState<string | null>(null)

  const now = new Date()
  const sorted = useMemo(() => sortCountdowns(countdowns, now), [countdowns]) // eslint-disable-line react-hooks/exhaustive-deps

  if (sorted.length === 0) {
    return (
      <div className={styles.panel}>
        <div className="empty-state">
          <span className="icon">⏳</span>
          <span>还没有倒数日</span>
          <span style={{ fontSize: 'var(--font-sm)' }}>点击右下角「+」新建一个，比如生日、纪念日、截止日期</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {sorted.map((item) => {
        const display = getCountdownDisplay(item, now)
        return (
          <button key={item.id} className={styles.card} onClick={() => setEditingId(item.id)}>
            <div className={styles.left}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.date}>
                {display.effectiveDate}
                {item.repeatYearly ? '（每年）' : ''}
              </span>
            </div>
            <div className={[styles.right, styles[display.direction]].join(' ')}>
              {display.direction === 'today' ? (
                <span className={styles.bigText}>就是今天</span>
              ) : (
                <>
                  <span className={styles.smallLabel}>{display.direction === 'future' ? '距离还有' : '已经过去'}</span>
                  <span className={styles.bigNumber}>{display.days}</span>
                  <span className={styles.unit}>天</span>
                </>
              )}
            </div>
          </button>
        )
      })}

      {editingId && (
        <CountdownEditModal
          initial={countdowns.find((c) => c.id === editingId)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}
