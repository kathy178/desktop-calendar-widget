/**
 * 提醒调度器：每 30 秒检查一次待办列表，找出"到达提醒时间且尚未触发过"的项，
 * 通过系统通知 + IPC 推送给渲染进程（应用内轻提示）。
 *
 * 设计上刻意选择"轮询"而不是为每条待办单独 setTimeout：
 * - 待办可以被随时编辑/删除/改时间，逐条维护定时器容易产生"僵尸定时器"和内存泄漏；
 * - 轮询逻辑简单、可预测，30 秒的粒度对"提醒"这个场景完全够用。
 */
import { Notification } from 'electron'
import type { BrowserWindow } from 'electron'
import { getAllData, updateTodo } from '../store/db'
import type { Todo } from '../../shared/types'
import { IPC } from '../../shared/ipcChannels'

const POLL_INTERVAL_MS = 30_000

function computeDueAt(todo: Todo): number | null {
  if (!todo.date) return null
  const timePart = todo.time ?? '00:00'
  const dueAt = new Date(`${todo.date}T${timePart}:00`)
  if (Number.isNaN(dueAt.getTime())) return null
  const minutesBefore = todo.reminder?.minutesBefore ?? 0
  return dueAt.getTime() - minutesBefore * 60_000
}

export function startReminderScheduler(getMainWindow: () => BrowserWindow | null): () => void {
  const timer = setInterval(() => {
    const { settings, todos } = getAllData()
    if (!settings.reminderEnabled) return

    const now = Date.now()
    for (const todo of todos) {
      if (todo.completed) continue
      if (!todo.reminder?.enabled) continue
      if (todo.reminderFiredAt) continue

      const dueAt = computeDueAt(todo)
      if (dueAt === null) continue
      // 允许一定的迟滞窗口：已经过了提醒时间，但还没超过 10 分钟，仍然弹提醒
      // （避免电脑休眠/应用刚启动时错过的提醒完全静默消失）
      if (now >= dueAt && now - dueAt <= 10 * 60_000) {
        fireReminder(todo, getMainWindow())
      }
    }
  }, POLL_INTERVAL_MS)

  return () => clearInterval(timer)
}

function fireReminder(todo: Todo, win: BrowserWindow | null): void {
  updateTodo({ ...todo, reminderFiredAt: new Date().toISOString() })

  if (Notification.isSupported()) {
    const notification = new Notification({
      title: '待办提醒',
      body: todo.title,
      silent: false
    })
    notification.show()
  }

  win?.webContents.send(IPC.REMINDER_FIRE, {
    todoId: todo.id,
    title: todo.title,
    date: todo.date,
    time: todo.time
  })
}
