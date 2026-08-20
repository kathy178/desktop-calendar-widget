import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { toDateKey } from '../../utils/calendar'
import { isDueToday, isOverdue, sortTodos } from '../../utils/todoUtils'
import TodoItem from './TodoItem'
import styles from './TodoPanel.module.css'

export default function TodoPanel(): JSX.Element {
  const todos = useAppStore((s) => s.todos)
  const [showCompleted, setShowCompleted] = useState(false)
  const now = new Date()
  const todayKey = toDateKey(now)

  const { overdue, todayList, upcoming, noDate, completed } = useMemo(() => {
    const active = todos.filter((t) => !t.completed)
    const overdueList = sortTodos(active.filter((t) => isOverdue(t, now)))
    const todayListLocal = sortTodos(active.filter((t) => isDueToday(t, now) && !isOverdue(t, now)))
    const upcomingList = sortTodos(active.filter((t) => t.date && t.date > todayKey))
    const noDateList = sortTodos(active.filter((t) => !t.date))
    const completedList = sortTodos(todos.filter((t) => t.completed)).reverse()
    return {
      overdue: overdueList,
      todayList: todayListLocal,
      upcoming: upcomingList,
      noDate: noDateList,
      completed: completedList
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, todayKey])

  const isEmpty =
    overdue.length === 0 && todayList.length === 0 && upcoming.length === 0 && noDate.length === 0

  return (
    <div className={styles.panel}>
      {isEmpty && completed.length === 0 && (
        <div className="empty-state">
          <span className="icon">✓</span>
          <span>暂时没有待办事项</span>
          <span style={{ fontSize: 'var(--font-sm)' }}>点击右下角「+」新建一条</span>
        </div>
      )}

      {overdue.length > 0 && (
        <Section title="已逾期" items={overdue} />
      )}
      {todayList.length > 0 && <Section title="今天" items={todayList} />}
      {upcoming.length > 0 && <Section title="即将到来" items={upcoming} />}
      {noDate.length > 0 && <Section title="未安排日期" items={noDate} />}

      {completed.length > 0 && (
        <div className={styles.completedSection}>
          <button className={styles.completedToggle} onClick={() => setShowCompleted((v) => !v)}>
            {showCompleted ? '收起' : '展开'}已完成（{completed.length}）
          </button>
          {showCompleted &&
            completed.map((todo) => (
              <div key={todo.id}>
                <TodoItem todo={todo} />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, items }: { title: string; items: ReturnType<typeof sortTodos> }): JSX.Element {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {items.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  )
}
