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

const WINDOW_MIN_WIDTH = 260
const WINDOW_MIN_HEIGHT = 56
const WINDOW_MAX_WIDTH = 480
const WINDOW_MAX_HEIGHT = 900

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function createMainWindow(settings: Settings): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth } = primaryDisplay.workAreaSize

  // 手动 clamp 一下存下来的窗口尺寸：万一是升级前保存的、或者被外部工具改过的异常数值，
  // 也不会导致窗口比 minWidth/maxWidth 限制更离谱。
  const width = clamp(settings.windowBounds.width || DEFAULT_WINDOW_SIZE.width, WINDOW_MIN_WIDTH, WINDOW_MAX_WIDTH)
  const height = clamp(settings.windowBounds.height || DEFAULT_WINDOW_SIZE.height, WINDOW_MIN_HEIGHT, WINDOW_MAX_HEIGHT)
  // 默认贴到屏幕右侧，符合"侧边悬浮工具"的定位
  const x = settings.windowBounds.x ?? screenWidth - width - 24
  const y = settings.windowBounds.y ?? 60

  const win = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    maxWidth: WINDOW_MAX_WIDTH,
    maxHeight: WINDOW_MAX_HEIGHT,
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
  // 注意：这里不再调用 win.setOpacity()。
  // "透明度"设置改为完全由渲染进程的 CSS 背景不透明度控制（见 App.tsx / theme.css），
  // 这样调低透明度只会让背景变透，文字/图标始终保持 100% 清晰，不会出现"越透明越难读"的问题；
  // 系统层面的窗口本身永远保持完全不透明。

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

export function setWindowAlwaysOnTop(value: boolean): void {
  mainWindow?.setAlwaysOnTop(value, 'screen-saver')
}

export function getCurrentBounds(): { x: number; y: number; width: number; height: number } | null {
  if (!mainWindow) return null
  const [x, y] = mainWindow.getPosition()
  const [width, height] = mainWindow.getSize()
  return { x, y, width, height }
}
