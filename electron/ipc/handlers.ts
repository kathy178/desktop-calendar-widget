/**
 * 待办 / 备忘录 / 设置 / 数据备份的 IPC 处理器统一注册。
 */
import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import { IPC } from '../../shared/ipcChannels'
import type { CountdownEvent, Memo, Settings, Todo, ExportPayload } from '../../shared/types'
import * as db from '../store/db'

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC.DATA_GET_ALL, () => db.getAllData())

  ipcMain.handle(IPC.TODO_CREATE, (_e, todo: Todo) => db.createTodo(todo))
  ipcMain.handle(IPC.TODO_UPDATE, (_e, todo: Todo) => db.updateTodo(todo))
  ipcMain.handle(IPC.TODO_REMOVE, (_e, id: string) => db.removeTodo(id))

  ipcMain.handle(IPC.MEMO_CREATE, (_e, memo: Memo) => db.createMemo(memo))
  ipcMain.handle(IPC.MEMO_UPDATE, (_e, memo: Memo) => db.updateMemo(memo))
  ipcMain.handle(IPC.MEMO_REMOVE, (_e, id: string) => db.removeMemo(id))

  ipcMain.handle(IPC.COUNTDOWN_CREATE, (_e, item: CountdownEvent) => db.createCountdown(item))
  ipcMain.handle(IPC.COUNTDOWN_UPDATE, (_e, item: CountdownEvent) => db.updateCountdown(item))
  ipcMain.handle(IPC.COUNTDOWN_REMOVE, (_e, id: string) => db.removeCountdown(id))

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_e, settings: Settings) => {
    const next = db.updateSettings(settings)
    applySettingsSideEffects(next, getMainWindow())
    return next
  })

  ipcMain.handle(IPC.BACKUP_EXPORT, async () => {
    const win = getMainWindow()
    if (!win) return { ok: false, error: '窗口不存在' }
    try {
      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        title: '导出数据',
        defaultPath: `桌面日历备份-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      if (canceled || !filePath) return { ok: false, error: '已取消' }
      const payload: ExportPayload = { ...db.getAllData(), exportedAt: new Date().toISOString() }
      writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8')
      return { ok: true, path: filePath }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle(IPC.BACKUP_IMPORT, async () => {
    const win = getMainWindow()
    if (!win) return { ok: false, error: '窗口不存在' }
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog(win, {
        title: '导入数据',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      if (canceled || filePaths.length === 0) return { ok: false, error: '已取消' }
      const raw = readFileSync(filePaths[0], 'utf-8')
      const parsed = JSON.parse(raw) as Partial<ExportPayload>

      if (!Array.isArray(parsed.todos) || !Array.isArray(parsed.memos) || !parsed.settings) {
        return { ok: false, error: '文件格式不正确，缺少 todos / memos / settings 字段' }
      }

      const data = db.replaceAllData({
        todos: parsed.todos,
        memos: parsed.memos,
        countdowns: Array.isArray(parsed.countdowns) ? parsed.countdowns : [],
        settings: parsed.settings
      })
      applySettingsSideEffects(data.settings, win)
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: `解析失败：${(err as Error).message}` }
    }
  })
}

/** 设置变更后需要同步生效的"物理"效果：置顶、开机自启 */
export function applySettingsSideEffects(settings: Settings, win: BrowserWindow | null): void {
  if (win) {
    win.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver')
  }
  try {
    app.setLoginItemSettings({ openAtLogin: settings.autoLaunch })
  } catch {
    // 部分打包/开发环境下（如未打包的 electron-vite dev 模式）设置开机自启可能不可用，静默忽略
  }
}
