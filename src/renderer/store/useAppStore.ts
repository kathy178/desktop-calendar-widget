/**
 * 全局状态管理（zustand）。
 *
 * 采用"单 store + 按领域分组字段"的方式（而不是拆成五六个独立 store），
 * 因为这个应用的数据量小、模块之间有联动（比如切换日期要同时影响待办面板和备忘录面板），
 * 单 store 让联动逻辑更直接，避免多个 store 之间互相订阅的复杂度。
 */
import { create } from 'zustand'
import { genId } from '@shared/id'
import type { AppTab, CalendarViewMode, CountdownEvent, Memo, Settings, Todo } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'
import { toDateKey, parseDateKey } from '../utils/calendar'

export interface ToastItem {
  id: string
  title: string
  body: string
  todoId?: string
}

interface AppState {
  // 数据
  todos: Todo[]
  memos: Memo[]
  countdowns: CountdownEvent[]
  settings: Settings
  loaded: boolean

  // UI 状态
  activeTab: AppTab
  calendarViewMode: CalendarViewMode
  monthAnchor: Date
  selectedDate: string
  collapsed: boolean
  hovering: boolean
  toasts: ToastItem[]
  settingsOpen: boolean

  // 初始化
  hydrate: (payload: { todos: Todo[]; memos: Memo[]; countdowns: CountdownEvent[]; settings: Settings }) => void

  // Todo actions
  addTodo: (input: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'reminderFiredAt'>) => Promise<void>
  editTodo: (todo: Todo) => Promise<void>
  toggleTodoCompleted: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>

  // Memo actions
  addMemo: (input: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  editMemo: (memo: Memo) => Promise<void>
  toggleMemoPinned: (id: string) => Promise<void>
  deleteMemo: (id: string) => Promise<void>

  // Countdown actions
  addCountdown: (input: Omit<CountdownEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  editCountdown: (item: CountdownEvent) => Promise<void>
  deleteCountdown: (id: string) => Promise<void>

  // Settings actions
  updateSettings: (patch: Partial<Settings>) => Promise<void>

  // UI actions
  setActiveTab: (tab: AppTab) => void
  setCalendarViewMode: (mode: CalendarViewMode) => void
  goToToday: () => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToPrevYear: () => void
  goToNextYear: () => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToPrevDay: () => void
  goToNextDay: () => void
  goPrev: () => void
  goNext: () => void
  setSelectedDate: (dateKey: string) => void
  setCollapsed: (collapsed: boolean) => void
  setHovering: (hovering: boolean) => void
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
  dismissToast: (id: string) => void
  setSettingsOpen: (open: boolean) => void
}

const today = new Date()

export const useAppStore = create<AppState>((set, get) => ({
  todos: [],
  memos: [],
  countdowns: [],
  settings: DEFAULT_SETTINGS,
  loaded: false,

  activeTab: 'today',
  calendarViewMode: 'month',
  monthAnchor: today,
  selectedDate: toDateKey(today),
  collapsed: false,
  hovering: false,
  toasts: [],
  settingsOpen: false,

  hydrate: ({ todos, memos, countdowns, settings }) => set({ todos, memos, countdowns, settings, loaded: true }),

  addTodo: async (input) => {
    const now = new Date().toISOString()
    const optimistic: Todo = { ...input, id: genId(), createdAt: now, updatedAt: now, reminderFiredAt: null }
    set((s) => ({ todos: [...s.todos, optimistic] }))
    try {
      const saved = await window.api.todo.create(optimistic)
      set((s) => ({ todos: s.todos.map((t) => (t.id === optimistic.id ? saved : t)) }))
    } catch (err) {
      // 落盘失败则回滚，避免界面显示了一条实际没保存成功的数据
      set((s) => ({ todos: s.todos.filter((t) => t.id !== optimistic.id) }))
      get().pushToast({ title: '保存失败', body: (err as Error).message })
    }
  },

  editTodo: async (todo) => {
    const prev = get().todos
    set((s) => ({ todos: s.todos.map((t) => (t.id === todo.id ? todo : t)) }))
    try {
      const saved = await window.api.todo.update(todo)
      set((s) => ({ todos: s.todos.map((t) => (t.id === saved.id ? saved : t)) }))
    } catch (err) {
      set({ todos: prev })
      get().pushToast({ title: '更新失败', body: (err as Error).message })
    }
  },

  toggleTodoCompleted: async (id) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return
    const next: Todo = {
      ...todo,
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date().toISOString() : null
    }
    await get().editTodo(next)
  },

  deleteTodo: async (id) => {
    const prev = get().todos
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
    try {
      await window.api.todo.remove(id)
    } catch (err) {
      set({ todos: prev })
      get().pushToast({ title: '删除失败', body: (err as Error).message })
    }
  },

  addMemo: async (input) => {
    const now = new Date().toISOString()
    const optimistic: Memo = { ...input, id: genId(), createdAt: now, updatedAt: now }
    set((s) => ({ memos: [...s.memos, optimistic] }))
    try {
      const saved = await window.api.memo.create(optimistic)
      set((s) => ({ memos: s.memos.map((m) => (m.id === optimistic.id ? saved : m)) }))
    } catch (err) {
      set((s) => ({ memos: s.memos.filter((m) => m.id !== optimistic.id) }))
      get().pushToast({ title: '保存失败', body: (err as Error).message })
    }
  },

  editMemo: async (memo) => {
    const prev = get().memos
    set((s) => ({ memos: s.memos.map((m) => (m.id === memo.id ? memo : m)) }))
    try {
      const saved = await window.api.memo.update(memo)
      set((s) => ({ memos: s.memos.map((m) => (m.id === saved.id ? saved : m)) }))
    } catch (err) {
      set({ memos: prev })
      get().pushToast({ title: '更新失败', body: (err as Error).message })
    }
  },

  toggleMemoPinned: async (id) => {
    const memo = get().memos.find((m) => m.id === id)
    if (!memo) return
    await get().editMemo({ ...memo, pinned: !memo.pinned })
  },

  deleteMemo: async (id) => {
    const prev = get().memos
    set((s) => ({ memos: s.memos.filter((m) => m.id !== id) }))
    try {
      await window.api.memo.remove(id)
    } catch (err) {
      set({ memos: prev })
      get().pushToast({ title: '删除失败', body: (err as Error).message })
    }
  },

  addCountdown: async (input) => {
    const now = new Date().toISOString()
    const optimistic: CountdownEvent = { ...input, id: genId(), createdAt: now, updatedAt: now }
    set((s) => ({ countdowns: [...s.countdowns, optimistic] }))
    try {
      const saved = await window.api.countdown.create(optimistic)
      set((s) => ({ countdowns: s.countdowns.map((c) => (c.id === optimistic.id ? saved : c)) }))
    } catch (err) {
      set((s) => ({ countdowns: s.countdowns.filter((c) => c.id !== optimistic.id) }))
      get().pushToast({ title: '保存失败', body: (err as Error).message })
    }
  },

  editCountdown: async (item) => {
    const prev = get().countdowns
    set((s) => ({ countdowns: s.countdowns.map((c) => (c.id === item.id ? item : c)) }))
    try {
      const saved = await window.api.countdown.update(item)
      set((s) => ({ countdowns: s.countdowns.map((c) => (c.id === saved.id ? saved : c)) }))
    } catch (err) {
      set({ countdowns: prev })
      get().pushToast({ title: '更新失败', body: (err as Error).message })
    }
  },

  deleteCountdown: async (id) => {
    const prev = get().countdowns
    set((s) => ({ countdowns: s.countdowns.filter((c) => c.id !== id) }))
    try {
      await window.api.countdown.remove(id)
    } catch (err) {
      set({ countdowns: prev })
      get().pushToast({ title: '删除失败', body: (err as Error).message })
    }
  },

  updateSettings: async (patch) => {
    const prev = get().settings
    const next = { ...prev, ...patch }
    set({ settings: next })
    try {
      const saved = await window.api.settings.update(next)
      set({ settings: saved })
    } catch (err) {
      set({ settings: prev })
      get().pushToast({ title: '设置保存失败', body: (err as Error).message })
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),
  goToToday: () => set({ monthAnchor: new Date(), selectedDate: toDateKey(new Date()) }),
  goToPrevMonth: () =>
    set((s) => {
      const d = new Date(s.monthAnchor)
      d.setMonth(d.getMonth() - 1)
      return { monthAnchor: d }
    }),
  goToNextMonth: () =>
    set((s) => {
      const d = new Date(s.monthAnchor)
      d.setMonth(d.getMonth() + 1)
      return { monthAnchor: d }
    }),
  goToPrevYear: () =>
    set((s) => {
      const d = new Date(s.monthAnchor)
      d.setFullYear(d.getFullYear() - 1)
      return { monthAnchor: d }
    }),
  goToNextYear: () =>
    set((s) => {
      const d = new Date(s.monthAnchor)
      d.setFullYear(d.getFullYear() + 1)
      return { monthAnchor: d }
    }),
  goToPrevWeek: () =>
    set((s) => {
      const d = parseDateKey(s.selectedDate)
      d.setDate(d.getDate() - 7)
      return { selectedDate: toDateKey(d), monthAnchor: d }
    }),
  goToNextWeek: () =>
    set((s) => {
      const d = parseDateKey(s.selectedDate)
      d.setDate(d.getDate() + 7)
      return { selectedDate: toDateKey(d), monthAnchor: d }
    }),
  goToPrevDay: () =>
    set((s) => {
      const d = parseDateKey(s.selectedDate)
      d.setDate(d.getDate() - 1)
      return { selectedDate: toDateKey(d), monthAnchor: d }
    }),
  goToNextDay: () =>
    set((s) => {
      const d = parseDateKey(s.selectedDate)
      d.setDate(d.getDate() + 1)
      return { selectedDate: toDateKey(d), monthAnchor: d }
    }),
  goPrev: () => {
    const mode = get().calendarViewMode
    if (mode === 'year') get().goToPrevYear()
    else if (mode === 'month') get().goToPrevMonth()
    else if (mode === 'week') get().goToPrevWeek()
    else get().goToPrevDay()
  },
  goNext: () => {
    const mode = get().calendarViewMode
    if (mode === 'year') get().goToNextYear()
    else if (mode === 'month') get().goToNextMonth()
    else if (mode === 'week') get().goToNextWeek()
    else get().goToNextDay()
  },
  setSelectedDate: (dateKey) => set({ selectedDate: dateKey, monthAnchor: parseDateKey(dateKey) }),
  setCollapsed: (collapsed) => set({ collapsed }),
  setHovering: (hovering) => set({ hovering }),
  pushToast: (toast) => set((s) => ({ toasts: [...s.toasts, { ...toast, id: genId() }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setSettingsOpen: (open) => set({ settingsOpen: open })
}))
