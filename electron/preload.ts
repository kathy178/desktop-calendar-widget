/**
 * preload：唯一被允许同时接触 Node.js API 和渲染进程 window 对象的地方。
 * 通过 contextBridge 只暴露"经过封装的、受限的"接口，
 * 渲染进程拿不到 ipcRenderer / fs 等原始能力，安全边界清晰。
 */
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipcChannels'
import type { DesktopWidgetApi } from '../shared/preloadApi'
import type { Memo, Settings, Todo, ReminderFirePayload } from '../shared/types'

const api: DesktopWidgetApi = {
  data: {
    getAll: () => ipcRenderer.invoke(IPC.DATA_GET_ALL)
  },
  todo: {
    create: (todo: Todo) => ipcRenderer.invoke(IPC.TODO_CREATE, todo),
    update: (todo: Todo) => ipcRenderer.invoke(IPC.TODO_UPDATE, todo),
    remove: (id: string) => ipcRenderer.invoke(IPC.TODO_REMOVE, id)
  },
  memo: {
    create: (memo: Memo) => ipcRenderer.invoke(IPC.MEMO_CREATE, memo),
    update: (memo: Memo) => ipcRenderer.invoke(IPC.MEMO_UPDATE, memo),
    remove: (id: string) => ipcRenderer.invoke(IPC.MEMO_REMOVE, id)
  },
  settings: {
    update: (settings: Settings) => ipcRenderer.invoke(IPC.SETTINGS_UPDATE, settings)
  },
  backup: {
    export: () => ipcRenderer.invoke(IPC.BACKUP_EXPORT),
    import: () => ipcRenderer.invoke(IPC.BACKUP_IMPORT)
  },
  window: {
    setAlwaysOnTop: (value: boolean) => ipcRenderer.send(IPC.WINDOW_SET_ALWAYS_ON_TOP, value),
    setClickThrough: (value: boolean) => ipcRenderer.send(IPC.WINDOW_SET_CLICK_THROUGH, value),
    setOpacity: (value: number) => ipcRenderer.send(IPC.WINDOW_SET_OPACITY, value),
    expandWidget: () => ipcRenderer.send(IPC.WINDOW_EXPAND_WIDGET),
    collapseWidget: () => ipcRenderer.send(IPC.WINDOW_COLLAPSE_WIDGET),
    minimize: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
    close: () => ipcRenderer.send(IPC.WINDOW_CLOSE)
  },
  reminder: {
    snooze: (todoId: string, minutes: number) => ipcRenderer.send(IPC.REMINDER_SNOOZE, todoId, minutes),
    complete: (todoId: string) => ipcRenderer.send(IPC.REMINDER_COMPLETE, todoId),
    onFire: (cb: (payload: ReminderFirePayload) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, payload: ReminderFirePayload): void => cb(payload)
      ipcRenderer.on(IPC.REMINDER_FIRE, listener)
      return () => ipcRenderer.removeListener(IPC.REMINDER_FIRE, listener)
    }
  },
  system: {
    getPlatform: () => process.platform
  }
}

contextBridge.exposeInMainWorld('api', api)
