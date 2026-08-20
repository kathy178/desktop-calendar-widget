import { describe, expect, it } from 'vitest'
import {
  isDueToday,
  isOverdue,
  isUpcoming,
  sortTodos,
  todosForDate,
  searchMemos,
  sortMemos
} from '../src/renderer/utils/todoUtils'
import type { Memo, Todo } from '../shared/types'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: overrides.title ?? '测试待办',
    date: overrides.date ?? null,
    time: overrides.time ?? null,
    priority: overrides.priority ?? 'medium',
    tags: overrides.tags ?? [],
    repeat: overrides.repeat ?? 'none',
    reminder: overrides.reminder ?? null,
    completed: overrides.completed ?? false,
    completedAt: overrides.completedAt ?? null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    reminderFiredAt: overrides.reminderFiredAt ?? null
  }
}

function makeMemo(overrides: Partial<Memo> = {}): Memo {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: overrides.title ?? '',
    content: overrides.content ?? '',
    linkedDate: overrides.linkedDate ?? null,
    tags: overrides.tags ?? [],
    color: overrides.color ?? 'yellow',
    pinned: overrides.pinned ?? false,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString()
  }
}

describe('todo日期判断', () => {
  const today = new Date(2026, 7, 20, 10, 0, 0) // 2026-08-20 10:00

  it('过去的日期算逾期', () => {
    const todo = makeTodo({ date: '2026-08-19' })
    expect(isOverdue(todo, today)).toBe(true)
  })

  it('今天但时间已过算逾期', () => {
    const todo = makeTodo({ date: '2026-08-20', time: '08:00' })
    expect(isOverdue(todo, today)).toBe(true)
  })

  it('今天但时间未到不算逾期', () => {
    const todo = makeTodo({ date: '2026-08-20', time: '18:00' })
    expect(isOverdue(todo, today)).toBe(false)
  })

  it('已完成的待办不算逾期', () => {
    const todo = makeTodo({ date: '2026-08-19', completed: true })
    expect(isOverdue(todo, today)).toBe(false)
  })

  it('无日期的待办不算逾期', () => {
    const todo = makeTodo({ date: null })
    expect(isOverdue(todo, today)).toBe(false)
  })

  it('今天到期判断', () => {
    expect(isDueToday(makeTodo({ date: '2026-08-20' }), today)).toBe(true)
    expect(isDueToday(makeTodo({ date: '2026-08-21' }), today)).toBe(false)
  })

  it('3天内即将到期判断', () => {
    expect(isUpcoming(makeTodo({ date: '2026-08-22' }), today)).toBe(true)
    expect(isUpcoming(makeTodo({ date: '2026-08-20' }), today)).toBe(false) // 今天不算"即将"
    expect(isUpcoming(makeTodo({ date: '2026-08-25' }), today)).toBe(false) // 超过3天
  })
})

describe('待办排序与筛选', () => {
  it('未完成排在已完成前面，日期早的排前面', () => {
    const todos = [
      makeTodo({ id: 'a', date: '2026-08-22', completed: false }),
      makeTodo({ id: 'b', date: '2026-08-20', completed: true }),
      makeTodo({ id: 'c', date: '2026-08-21', completed: false })
    ]
    const sorted = sortTodos(todos)
    expect(sorted.map((t) => t.id)).toEqual(['c', 'a', 'b'])
  })

  it('todosForDate 只返回指定日期的待办', () => {
    const todos = [
      makeTodo({ id: 'a', date: '2026-08-20' }),
      makeTodo({ id: 'b', date: '2026-08-21' })
    ]
    expect(todosForDate(todos, '2026-08-20').map((t) => t.id)).toEqual(['a'])
  })
})

describe('备忘录搜索与排序', () => {
  it('搜索标题、正文、标签均可命中', () => {
    const memos = [
      makeMemo({ id: 'a', title: '周会纪要' }),
      makeMemo({ id: 'b', content: '买菜清单' }),
      makeMemo({ id: 'c', tags: ['重要'] })
    ]
    expect(searchMemos(memos, '周会').map((m) => m.id)).toEqual(['a'])
    expect(searchMemos(memos, '买菜').map((m) => m.id)).toEqual(['b'])
    expect(searchMemos(memos, '重要').map((m) => m.id)).toEqual(['c'])
  })

  it('置顶的备忘录排在最前面', () => {
    const memos = [
      makeMemo({ id: 'a', pinned: false, updatedAt: '2026-08-20T10:00:00.000Z' }),
      makeMemo({ id: 'b', pinned: true, updatedAt: '2026-08-19T10:00:00.000Z' })
    ]
    expect(sortMemos(memos).map((m) => m.id)).toEqual(['b', 'a'])
  })
})
