import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { toDateKey } from '../../utils/calendar'
import { isDueToday, isOverdue, sortTodos } from '../../utils/todoUtils'
import styles from './WidgetCapsule.module.css'

export default function WidgetCapsule(): JSX.Element {
  const todos = useAppStore((s) => s.todos)
  const memos = useAppStore((s) => s.memos)
  const setCollapsed = useAppStore((s) => s.setCollapsed)

  const now = new Date()
  const todayKey = toDateKey(now)

  const { pendingCount, latestLabel } = useMemo(() => {
    const active = todos.filter((t) => !t.completed)
    const pending = active.filter((t) => isDueToday(t, now) || isOverdue(t, now))
    const nextTodo = sortTodos(pending)[0]
    const latestMemo = [...memos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

    let label = '暂无待办或备忘录'
    if (nextTodo) label = `待办：${nextTodo.title}`
    else if (latestMemo) label = `备忘：${latestMemo.title || latestMemo.content}`

    return { pendingCount: pending.length, latestLabel: label }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, memos])

  return (
    <div className={styles.capsule}>
      <div className={`${styles.left} drag-region`}>
        <span className={styles.date}>{todayKey.slice(5).replace('-', '/')}</span>
        <span className={styles.count}>剩余 {pendingCount} 项</span>
      </div>
      <button
        className={`${styles.expandArea} no-drag`}
        onClick={() => setCollapsed(false)}
        aria-label="展开完整面板"
        title="展开完整面板"
      >
        <span className={styles.latest}>{latestLabel}</span>
        <span className={styles.arrow}>▸</span>
      </button>
    </div>
  )
}
