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
    // 注意：这里只应用"实际生效值"，不写回 settings。
    // 渲染进程（useWidgetMode）会根据"是否收起成小胶囊"动态计算出这个生效值再调用这里——
    // 比如用户勾选了点击穿透偏好，但当前完整面板正展开着，这里收到的实际是 false（強制关闭），
    // 如果在这里把 false 存回 settings.clickThrough，会错误覆盖用户真正的偏好设置。
    // 用户的偏好本身通过 settings:update 这个通用通道保存，跟这里完全分开。
    setClickThrough(value)
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
    // 注意：这里故意不用 toISOString()（那是 UTC 时间），todo.date/time 全项目都是按本地时间处理的，
    // 用 UTC 换算会在东八区这类正时区下导致稍后提醒实际触发时间整体偏移几个小时。
    const y = next.getFullYear()
    const mo = String(next.getMonth() + 1).padStart(2, '0')
    const d = String(next.getDate()).padStart(2, '0')
    const hh = String(next.getHours()).padStart(2, '0')
    const mm = String(next.getMinutes()).padStart(2, '0')
    updateTodo({
      ...todo,
      date: `${y}-${mo}-${d}`,
      time: `${hh}:${mm}`,
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
