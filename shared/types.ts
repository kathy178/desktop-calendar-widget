/**
 * 全局共享类型定义。
 * 主进程 (electron/) 与渲染进程 (src/renderer/) 都会引用这里的类型，
 * 保证 IPC 通信双方的数据结构完全一致。
 */

export type Priority = 'high' | 'medium' | 'low'

export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly'

export type ThemeMode = 'light' | 'dark' | 'system'

export type FontSize = 'small' | 'medium' | 'large'

export type MemoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'gray'

export type CalendarViewMode = 'year' | 'month' | 'week' | 'day'

export type AppTab = 'today' | 'todo' | 'memo' | 'countdown'

export interface ReminderConfig {
  enabled: boolean
  /** 提前多少分钟提醒，0 表示准点提醒 */
  minutesBefore: number
}

export interface Todo {
  id: string
  title: string
  /** YYYY-MM-DD，为空表示未指定日期（收件箱待办） */
  date: string | null
  /** HH:mm，可选 */
  time: string | null
  priority: Priority
  tags: string[]
  repeat: RepeatRule
  reminder: ReminderConfig | null
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
  /** 提醒是否已经在本次到期时触发过，避免重复弹通知 */
  reminderFiredAt: string | null
}

export interface Memo {
  id: string
  title: string
  content: string
  linkedDate: string | null
  tags: string[]
  color: MemoColor
  pinned: boolean
  createdAt: string
  updatedAt: string
}

/** 倒数日：距离某个日期还有多少天 / 已经过去多少天 */
export interface CountdownEvent {
  id: string
  title: string
  /** YYYY-MM-DD */
  targetDate: string
  /** 每年重复（如生日、纪念日），到期后自动按"下一次出现的日期"计算 */
  repeatYearly: boolean
  createdAt: string
  updatedAt: string
}

export interface Settings {
  autoLaunch: boolean
  alwaysOnTop: boolean
  theme: ThemeMode
  fontSize: FontSize
  opacity: number
  clickThrough: boolean
  reminderEnabled: boolean
  windowBounds: { x: number | null; y: number | null; width: number; height: number }
}

export interface AppData {
  version: string
  todos: Todo[]
  memos: Memo[]
  countdowns: CountdownEvent[]
  settings: Settings
}

export const DEFAULT_WINDOW_SIZE = { width: 360, height: 520 }
export const WIDGET_SIZE = { width: 260, height: 56 }

export const DEFAULT_SETTINGS: Settings = {
  autoLaunch: false,
  alwaysOnTop: true,
  theme: 'system',
  fontSize: 'medium',
  opacity: 1,
  clickThrough: false,
  reminderEnabled: true,
  windowBounds: { x: null, y: null, width: DEFAULT_WINDOW_SIZE.width, height: DEFAULT_WINDOW_SIZE.height }
}

/** 提醒触发时，通过 IPC 从主进程推送到渲染进程的载荷 */
export interface ReminderFirePayload {
  todoId: string
  title: string
  date: string | null
  time: string | null
}

/** 导出文件的顶层结构，带一个 exportedAt 方便追溯 */
export interface ExportPayload extends AppData {
  exportedAt: string
}
