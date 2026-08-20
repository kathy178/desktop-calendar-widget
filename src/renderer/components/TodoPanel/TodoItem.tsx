import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { Todo } from '@shared/types'
import { isOverdue, PRIORITY_COLOR } from '../../utils/todoUtils'
import TodoEditModal from './TodoEditModal'
import styles from './TodoPanel.module.css'

export default function TodoItem({ todo }: { todo: Todo }): JSX.Element {
  const toggleTodoCompleted = useAppStore((s) => s.toggleTodoCompleted)
  const [editing, setEditing] = useState(false)
  const overdue = isOverdue(todo, new Date())

  return (
    <>
      <div className={`${styles.item} ${todo.completed ? styles.itemDone : ''}`}>
        <button
          className={`${styles.checkbox} ${todo.completed ? styles.checkboxChecked : ''}`}
          onClick={() => toggleTodoCompleted(todo.id)}
          aria-label={todo.completed ? '标记未完成' : '标记完成'}
        >
          {todo.completed && '✓'}
        </button>
        <div className={styles.itemBody} onClick={() => setEditing(true)}>
          <div className={styles.itemTop}>
            <span
              className={styles.priorityDot}
              style={{ background: PRIORITY_COLOR[todo.priority] }}
              title={`优先级：${todo.priority}`}
            />
            <span className={styles.itemTitle}>{todo.title}</span>
          </div>
          <div className={styles.itemMeta}>
            {todo.date && (
              <span className={overdue ? styles.metaOverdue : ''}>
                {todo.date}
                {todo.time ? ` ${todo.time}` : ''}
                {overdue ? '（已逾期）' : ''}
              </span>
            )}
            {todo.repeat !== 'none' && (
              <span className={styles.repeatBadge}>
                {{ daily: '每天', weekly: '每周', monthly: '每月', none: '' }[todo.repeat]}
              </span>
            )}
            {todo.tags.map((tag) => (
              <span key={tag} className={styles.tagBadge}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      {editing && <TodoEditModal initial={todo} onClose={() => setEditing(false)} />}
    </>
  )
}
