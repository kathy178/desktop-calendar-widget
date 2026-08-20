import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import styles from './Toast.module.css'

const AUTO_DISMISS_MS = 15000

export default function ToastContainer(): JSX.Element {
  const toasts = useAppStore((s) => s.toasts)

  return (
    <div className={`${styles.container} no-drag`}>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} id={toast.id} title={toast.title} body={toast.body} todoId={toast.todoId} />
      ))}
    </div>
  )
}

function ToastCard({
  id,
  title,
  body,
  todoId
}: {
  id: string
  title: string
  body: string
  todoId?: string
}): JSX.Element {
  const dismissToast = useAppStore((s) => s.dismissToast)

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [id, dismissToast])

  function snooze(minutes: number): void {
    if (todoId) window.api.reminder.snooze(todoId, minutes)
    dismissToast(id)
  }

  function complete(): void {
    if (todoId) window.api.reminder.complete(todoId)
    dismissToast(id)
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.closeBtn} onClick={() => dismissToast(id)}>
          ×
        </button>
      </div>
      <p className={styles.body}>{body}</p>
      {todoId && (
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => snooze(10)}>
            10分钟后
          </button>
          <button className={styles.actionBtn} onClick={() => snooze(30)}>
            30分钟后
          </button>
          <button className={styles.actionBtn} onClick={() => snooze(60)}>
            1小时后
          </button>
          <button className={styles.completeBtn} onClick={complete}>
            标记完成
          </button>
        </div>
      )}
    </div>
  )
}
