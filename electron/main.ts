/**
 * 主进程入口：应用生命周期、窗口创建、IPC 注册、提醒调度启动。
 */
import { app, ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../shared/ipcChannels'
import {
  createMainWindow,
  getMainWindow,
  expandWidget,
  collapseWidget,
  setClickThrough,
  setWindowOpacity,
  setWindowAlwaysOnTop,
  getCurrentBounds
} from './windowManager'
import { registerIpcHandlers } from './ipc/handlers'
import { startReminderScheduler } from './ipc/reminderScheduler'
import { getSettings, updateSettings, updateTodo, getAllData } from './store/db'

// 悬浮小工具场景下一般不需要多开，单实例锁避免用户手滑打开好几个窗口
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    const settings = getSettings()
    const win = createMainWindow(settings)

    registerIpcHandlers(getMainWindow)
    registerWindowIpc(win)

    const stopScheduler = startReminderScheduler(getMainWindow)
    app.on('before-quit', () => {
      stopScheduler()
      persistWindowBounds()
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(getSettings())
      }
    })
  })

  app.on('window-all-closed', () => {
    persistWindowBounds()
    if (process.platform !== 'darwin') app.quit()
  })
}

function persistWindowBounds(): void {
  const bounds = getCurrentBounds()
  if (!bounds) return
  const settings = getSettings()
  updateSettings({ ...settings, windowBounds: { ...bounds } })
}

function registerWindowIpc(win: BrowserWindow): void {
  ipcMain.on(IPC.WINDOW_SET_ALWAYS_ON_TOP, (_e, value: boolean) => {
    setWindowAlwaysOnTop(value)
    const settings = getSettings()
    updateSettings({ ...settings, alwaysOnTop: value })
  })

  ipcMain.on(IPC.WINDOW_SET_CLICK_THROUGH, (_e, value: boolean) => {
    setClickThrough(value)
    const settings = getSettings()
    updateSettings({ ...settings, clickThrough: value })
  })

  ipcMain.on(IPC.WINDOW_SET_OPACITY, (_e, value: number) => {
    setWindowOpacity(value)
    const settings = getSettings()
    updateSettings({ ...settings, opacity: value })
  })

  ipcMain.on(IPC.WINDOW_EXPAND_WIDGET, () => expandWidget())
  ipcMain.on(IPC.WINDOW_COLLAPSE_WIDGET, () => collapseWidget())
  ipcMain.on(IPC.WINDOW_MINIMIZE, () => win.minimize())
  ipcMain.on(IPC.WINDOW_CLOSE, () => {
    persistWindowBounds()
    app.quit()
  })

  ipcMain.on(IPC.REMINDER_SNOOZE, (_e, todoId: string, minutes: number) => {
    const { todos } = getAllData()
    const todo = todos.find((t) => t.id === todoId)
    if (!todo) return
    const base = todo.date && todo.time ? new Date(`${todo.date}T${todo.time}:00`) : new Date()
    const next = new Date(base.getTime() + minutes * 60_000)
    updateTodo({
      ...todo,
      date: next.toISOString().slice(0, 10),
      time: next.toISOString().slice(11, 16),
      reminderFiredAt: null
    })
  })

  ipcMain.on(IPC.REMINDER_COMPLETE, (_e, todoId: string) => {
    const { todos } = getAllData()
    const todo = todos.find((t) => t.id === todoId)
    if (!todo) return
    updateTodo({ ...todo, completed: true, completedAt: new Date().toISOString() })
  })
}
