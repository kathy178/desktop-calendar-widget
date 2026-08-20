import type { Memo, Priority, Todo } from '@shared/types'
import { toDateKey } from './calendar'

export interface DayDotInfo {
  hasTodo: boolean
  hasHighPriority: boolean
  hasMemo: boolean
}

export const EMPTY_DOT_INFO: DayDotInfo = { hasTodo: false, hasHighPriority: false, hasMemo: false }

/**
 * 把"每天有没有待办/备忘录"一次性算好存成一张表，而不是让每个日期格子各自
 * 遍历一遍完整的 todos/memos 数组——月视图/年视图有几十到几百个格子，
 * 之前的写法相当于每次任何一条待办变化都要做几十上百次全量遍历，是卡顿的主要原因之一。
 */
export function buildDotInfoMap(todos: Todo[], memos: Memo[]): Map<string, DayDotInfo> {
  const map = new Map<string, DayDotInfo>()

  for (const todo of todos) {
    if (todo.completed || !todo.date) continue
    const info = map.get(todo.date) ?? { hasTodo: false, hasHighPriority: false, hasMemo: false }
    info.hasTodo = true
    if (todo.priority === 'high') info.hasHighPriority = true
    map.set(todo.date, info)
  }

  for (const memo of memos) {
    if (!memo.linkedDate) continue
    const info = map.get(memo.linkedDate) ?? { hasTodo: false, hasHighPriority: false, hasMemo: false }
    info.hasMemo = true
    map.set(memo.linkedDate, info)
  }

  return map
}

export function isOverdue(todo: Todo, today: Date): boolean {
  if (todo.completed || !todo.date) return false
  const todoDate = todo.date
  const todayKey = toDateKey(today)
  if (todoDate < todayKey) return true
  if (todoDate === todayKey && todo.time) {
    const now = today
    const [h, m] = todo.time.split(':').map(Number)
    const due = new Date(now)
    due.setHours(h, m, 0, 0)
    return now.getTime() > due.getTime()
  }
  return false
}

export function isDueToday(todo: Todo, today: Date): boolean {
  return todo.date === toDateKey(today)
}

export function isUpcoming(todo: Todo, today: Date, withinDays = 3): boolean {
  if (todo.completed || !todo.date) return false
  const todayKey = toDateKey(today)
  const future = new Date(today)
  future.setDate(future.getDate() + withinDays)
  const futureKey = toDateKey(future)
  return todo.date > todayKey && todo.date <= futureKey
}

export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const dateA = a.date ?? '9999-99-99'
    const dateB = b.date ?? '9999-99-99'
    if (dateA !== dateB) return dateA < dateB ? -1 : 1
    const timeA = a.time ?? '99:99'
    const timeB = b.time ?? '99:99'
    if (timeA !== timeB) return timeA < timeB ? -1 : 1
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })
}

export function todosForDate(todos: Todo[], dateKey: string): Todo[] {
  return sortTodos(todos.filter((t) => t.date === dateKey))
}

export function memosForDate(memos: Memo[], dateKey: string): Memo[] {
  return memos.filter((m) => m.linkedDate === dateKey)
}

export function sortMemos(memos: Memo[]): Memo[] {
  return [...memos].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function searchMemos(memos: Memo[], keyword: string): Memo[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return memos
  return memos.filter(
    (m) =>
      m.title.toLowerCase().includes(kw) ||
      m.content.toLowerCase().includes(kw) ||
      m.tags.some((tag) => tag.toLowerCase().includes(kw))
  )
}

export const PRIORITY_LABEL: Record<Priority, string> = { high: '高', medium: '中', low: '低' }
export const PRIORITY_COLOR: Record<Priority, string> = {
  high: 'var(--color-danger)',
  medium: 'var(--color-warning)',
  low: 'var(--color-muted)'
}

export const MEMO_COLOR_HEX: Record<string, string> = {
  yellow: '#F5D67B',
  blue: '#8EC3E8',
  green: '#A6D5B0',
  pink: '#F0B7C4',
  purple: '#C7B4E3',
  gray: '#D6D6D6'
}
