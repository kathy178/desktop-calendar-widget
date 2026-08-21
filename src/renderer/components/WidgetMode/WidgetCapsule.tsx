import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { toDateKey, WEEKDAY_LABELS } from '../../utils/calendar'
import { isDueToday, isOverdue, sortTodos } from '../../utils/todoUtils'
import { getCountdownDisplay, sortCountdowns } from '../../utils/countdownUtils'
import styles from './WidgetCapsule.module.css'

export default function WidgetCapsule(): JSX.Element {
  const todos = useAppStore((s) => s.todos)
  const countdowns = useAppStore((s) => s.countdowns)
  const setCollapsed = useAppStore((s) => s.setCollapsed)

  const now = new Date()
  const todayKey = toDateKey(now)
  const weekdayLabel = `周${WEEKDAY_LABELS[now.getDay()]}`

  const latestLabel = useMemo(() => {
    // 优先显示最近的倒数日；没有倒数日就回退显示最近一条待办；都没有就显示占位文案
    const nearestCountdown = sortCountdowns(countdowns, now)[0]
    if (nearestCountdown) {
      const display = getCountdownDisplay(nearestCountdown, now)
      if (display.direction === 'today') return `${nearestCountdown.title}：就是今天`
      const verb = display.direction === 'future' ? '距离还有' : '已经过去'
      return `${nearestCountdown.title} ${verb} ${display.days} 天`
    }

    const active = todos.filter((t) => !t.completed)
    const pending = active.filter((t) => isDueToday(t, now) || isOverdue(t, now))
    const nextTodo = sortTodos(pending)[0]
    if (nextTodo) return `待办：${nextTodo.title}`

    return '暂无安排'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, countdowns])

  return (
    <div className={styles.capsule}>
      <div className={`${styles.left} drag-region`}>
        <span className={styles.date}>{todayKey.slice(5).replace('-', '/')}</span>
        <span className={styles.weekday}>{weekdayLabel}</span>
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
