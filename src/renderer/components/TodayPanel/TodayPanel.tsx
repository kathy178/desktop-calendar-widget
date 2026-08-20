import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { formatFullDate, parseDateKey, toDateKey } from '../../utils/calendar'
import { isUpcoming, memosForDate, sortTodos, todosForDate } from '../../utils/todoUtils'
import TodoItem from '../TodoPanel/TodoItem'
import MemoCard from '../MemoPanel/MemoCard'
import TodoEditModal from '../TodoPanel/TodoEditModal'
import styles from './TodayPanel.module.css'

export default function TodayPanel(): JSX.Element {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const todos = useAppStore((s) => s.todos)
  const memos = useAppStore((s) => s.memos)
  const [quickAdding, setQuickAdding] = useState(false)

  const now = new Date()
  const isViewingToday = selectedDate === toDateKey(now)

  const dayTodos = useMemo(() => todosForDate(todos, selectedDate), [todos, selectedDate])
  const dayMemos = useMemo(() => memosForDate(memos, selectedDate), [memos, selectedDate])
  const upcoming = useMemo(
    () => (isViewingToday ? sortTodos(todos.filter((t) => isUpcoming(t, now))) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, isViewingToday]
  )

  const dateLabel = formatFullDate(parseDateKey(selectedDate))
  const isEmpty = dayTodos.length === 0 && dayMemos.length === 0

  return (
    <div className={styles.panel}>
      <div className={styles.dateRow}>
        <span className={styles.dateLabel}>{dateLabel}</span>
        <button className={styles.quickAddBtn} onClick={() => setQuickAdding(true)}>
          + 新增
        </button>
      </div>

      {isEmpty ? (
        <div className="empty-state" style={{ padding: '20px 16px' }}>
          <span className="icon">☀</span>
          <span>这一天还没有安排</span>
        </div>
      ) : (
        <>
          {dayTodos.length > 0 && (
            <div className={styles.section}>
              {dayTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}
          {dayMemos.length > 0 && (
            <div className={styles.section}>
              {dayMemos.map((memo) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
            </div>
          )}
        </>
      )}

      {isViewingToday && upcoming.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>即将到期（3天内）</div>
          {upcoming.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}

      {quickAdding && <TodoEditModal defaultDate={selectedDate} onClose={() => setQuickAdding(false)} />}
    </div>
  )
}
