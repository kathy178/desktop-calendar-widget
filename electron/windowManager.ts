/**
 * 窗口管理：创建无边框悬浮窗，处理置顶/拖拽/点击穿透/展开收起（小组件模式）。
 *
 * 收起/展开采用"单窗口动态 resize"方案：
 * - 展开态：360x520，显示完整面板
 * - 收起态：260x56，只显示日期/待办数量摘要（内容由渲染进程根据 collapsed 状态切换）
 * 好处是不需要维护两个窗口之间的位置/焦点同步，实现和调试成本都更低。
 */
import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from './utils/env'
import type { Settings } from '../shared/types'
import { DEFAULT_WINDOW_SIZE, WIDGET_SIZE } from '../shared/types'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createMainWindow(settings: Settings): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth } = primaryDisplay.workAreaSize

  const width = settings.windowBounds.width || DEFAULT_WINDOW_SIZE.width
  const height = settings.windowBounds.height || DEFAULT_WINDOW_SIZE.height
  // 默认贴到屏幕右侧，符合"侧边悬浮工具"的定位
  const x = settings.windowBounds.x ?? screenWidth - width - 24
  const y = settings.windowBounds.y ?? 60

  const win = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 260,
    minHeight: 56,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: false,
    hasShadow: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver')
  win.setOpacity(Math.min(1, Math.max(0.3, settings.opacity)))

  win.once('ready-to-show', () => win.show())

  // 外部链接（如果以后加入"关于/反馈"链接）在系统默认浏览器打开，而不是在应用内跳转
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow = win
  win.on('closed', () => {
    mainWindow = null
  })

  return win
}

export function expandWidget(): void {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  const currentWidth = mainWindow.getSize()[0]
  // 收起态是靠右对齐的胶囊条，展开时保持右边缘不动，向左延展，视觉上更自然
  const nextX = x - (DEFAULT_WINDOW_SIZE.width - currentWidth)
  mainWindow.setBounds({
    x: Math.max(0, nextX),
    y,
    width: DEFAULT_WINDOW_SIZE.width,
    height: DEFAULT_WINDOW_SIZE.height
  })
}

export function collapseWidget(): void {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  const currentWidth = mainWindow.getSize()[0]
  const nextX = x + (currentWidth - WIDGET_SIZE.width)
  mainWindow.setBounds({
    x: Math.max(0, nextX),
    y,
    width: WIDGET_SIZE.width,
    height: WIDGET_SIZE.height
  })
}

export function setClickThrough(enabled: boolean): void {
  mainWindow?.setIgnoreMouseEvents(enabled, { forward: true })
}

export function setWindowOpacity(value: number): void {
  mainWindow?.setOpacity(Math.min(1, Math.max(0.3, value)))
}

export function setWindowAlwaysOnTop(value: boolean): void {
  mainWindow?.setAlwaysOnTop(value, 'screen-saver')
}

export function getCurrentBounds(): { x: number; y: number; width: number; height: number } | null {
  if (!mainWindow) return null
  const [x, y] = mainWindow.getPosition()
  const [width, height] = mainWindow.getSize()
  return { x, y, width, height }
}
