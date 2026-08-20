/**
 * preload 通过 contextBridge 暴露给渲染进程的 API 形状。
 * 渲染进程通过 window.api.xxx 调用，类型在这里统一声明，
 * 避免 any，保证主进程/渲染进程/preload 三端类型同步。
 */
import type { AppData, Memo, Settings, Todo, ReminderFirePayload, ExportPayload } from './types'

export interface DesktopWidgetApi {
  data: {
    getAll: () => Promise<AppData>
  }
  todo: {
    create: (todo: Todo) => Promise<Todo>
    update: (todo: Todo) => Promise<Todo>
    remove: (id: string) => Promise<void>
  }
  memo: {
    create: (memo: Memo) => Promise<Memo>
    update: (memo: Memo) => Promise<Memo>
    remove: (id: string) => Promise<void>
  }
  settings: {
    update: (settings: Settings) => Promise<Settings>
  }
  backup: {
    export: () => Promise<{ ok: boolean; path?: string; error?: string }>
    import: () => Promise<{ ok: boolean; data?: AppData; error?: string }>
  }
  window: {
    setAlwaysOnTop: (value: boolean) => void
    setClickThrough: (value: boolean) => void
    setOpacity: (value: number) => void
    expandWidget: () => void
    collapseWidget: () => void
    minimize: () => void
    close: () => void
  }
  reminder: {
    snooze: (todoId: string, minutes: number) => void
    complete: (todoId: string) => void
    onFire: (cb: (payload: ReminderFirePayload) => void) => () => void
  }
  system: {
    getPlatform: () => string
  }
}

export type { AppData, Memo, Settings, Todo, ReminderFirePayload, ExportPayload }
