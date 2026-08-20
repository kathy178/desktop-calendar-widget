/**
 * 本地数据存储层。使用 electron-store（底层是 JSON 文件，落盘在系统的用户数据目录），
 * 零原生编译依赖，跨机器打包稳定。
 *
 * 文件位置大致为：
 *   Windows: %APPDATA%/桌面悬浮日历/app-data.json
 */
import Store from 'electron-store'
import { genId } from '../../shared/id'
import type { AppData, CountdownEvent, Memo, Settings, Todo } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/types'
import { buildSampleData } from './sampleData'

const CURRENT_DATA_VERSION = '1.0.0'

interface StoreShape {
  version: string
  todos: Todo[]
  memos: Memo[]
  countdowns: CountdownEvent[]
  settings: Settings
  /** 标记是否已经写入过示例数据，避免用户清空数据后又被重新塞入示例数据 */
  hasSeeded: boolean
}

const store = new Store<StoreShape>({
  name: 'app-data',
  defaults: {
    version: CURRENT_DATA_VERSION,
    todos: [],
    memos: [],
    countdowns: [],
    settings: DEFAULT_SETTINGS,
    hasSeeded: false
  },
  // 简单的数据迁移钩子，未来 version 升级时可以在这里写迁移逻辑
  migrations: {}
})

/** 首次启动时注入示例数据，方便用户立刻体验功能而不是面对空白页 */
function ensureSeeded(): void {
  if (store.get('hasSeeded')) return
  const hasAnyData =
    store.get('todos').length > 0 || store.get('memos').length > 0 || store.get('countdowns').length > 0
  if (!hasAnyData) {
    const { todos, memos, countdowns } = buildSampleData()
    store.set('todos', todos)
    store.set('memos', memos)
    store.set('countdowns', countdowns)
  }
  store.set('hasSeeded', true)
}

ensureSeeded()

export function getAllData(): AppData {
  return {
    version: store.get('version'),
    todos: store.get('todos'),
    memos: store.get('memos'),
    countdowns: store.get('countdowns'),
    settings: store.get('settings')
  }
}

export function getSettings(): Settings {
  return store.get('settings')
}

export function updateSettings(next: Settings): Settings {
  store.set('settings', next)
  return next
}

// ---------- Todo ----------
export function createTodo(input: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Todo, 'id'>>): Todo {
  const now = new Date().toISOString()
  const todo: Todo = {
    ...input,
    id: input.id ?? genId(),
    createdAt: now,
    updatedAt: now
  }
  const todos = store.get('todos')
  todos.push(todo)
  store.set('todos', todos)
  return todo
}

export function updateTodo(todo: Todo): Todo {
  const todos = store.get('todos')
  const idx = todos.findIndex((t) => t.id === todo.id)
  const next: Todo = { ...todo, updatedAt: new Date().toISOString() }
  if (idx === -1) {
    todos.push(next)
  } else {
    todos[idx] = next
  }
  store.set('todos', todos)
  return next
}

export function removeTodo(id: string): void {
  const todos = store.get('todos').filter((t) => t.id !== id)
  store.set('todos', todos)
}

// ---------- Memo ----------
export function createMemo(input: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Memo, 'id'>>): Memo {
  const now = new Date().toISOString()
  const memo: Memo = {
    ...input,
    id: input.id ?? genId(),
    createdAt: now,
    updatedAt: now
  }
  const memos = store.get('memos')
  memos.push(memo)
  store.set('memos', memos)
  return memo
}

export function updateMemo(memo: Memo): Memo {
  const memos = store.get('memos')
  const idx = memos.findIndex((m) => m.id === memo.id)
  const next: Memo = { ...memo, updatedAt: new Date().toISOString() }
  if (idx === -1) {
    memos.push(next)
  } else {
    memos[idx] = next
  }
  store.set('memos', memos)
  return next
}

export function removeMemo(id: string): void {
  const memos = store.get('memos').filter((m) => m.id !== id)
  store.set('memos', memos)
}

// ---------- Countdown ----------
export function createCountdown(
  input: Omit<CountdownEvent, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<CountdownEvent, 'id'>>
): CountdownEvent {
  const now = new Date().toISOString()
  const item: CountdownEvent = {
    ...input,
    id: input.id ?? genId(),
    createdAt: now,
    updatedAt: now
  }
  const countdowns = store.get('countdowns')
  countdowns.push(item)
  store.set('countdowns', countdowns)
  return item
}

export function updateCountdown(item: CountdownEvent): CountdownEvent {
  const countdowns = store.get('countdowns')
  const idx = countdowns.findIndex((c) => c.id === item.id)
  const next: CountdownEvent = { ...item, updatedAt: new Date().toISOString() }
  if (idx === -1) {
    countdowns.push(next)
  } else {
    countdowns[idx] = next
  }
  store.set('countdowns', countdowns)
  return next
}

export function removeCountdown(id: string): void {
  const countdowns = store.get('countdowns').filter((c) => c.id !== id)
  store.set('countdowns', countdowns)
}

// ---------- 导入 / 覆盖（用于数据恢复）----------
export function replaceAllData(data: Pick<AppData, 'todos' | 'memos' | 'countdowns' | 'settings'>): AppData {
  store.set('todos', data.todos)
  store.set('memos', data.memos)
  store.set('countdowns', data.countdowns)
  store.set('settings', data.settings)
  store.set('hasSeeded', true)
  return getAllData()
}

export function getStoreFilePath(): string {
  return store.path
}
