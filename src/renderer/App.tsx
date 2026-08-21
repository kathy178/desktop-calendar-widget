import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import { useWidgetMode } from './hooks/useWidgetMode'
import TitleBar from './components/TitleBar/TitleBar'
import Header from './components/Header/Header'
import CalendarView from './components/CalendarView/CalendarView'
import YearView from './components/CalendarView/YearView'
import TabBar from './components/TabBar/TabBar'
import TodayPanel from './components/TodayPanel/TodayPanel'
import TodoPanel from './components/TodoPanel/TodoPanel'
import MemoPanel from './components/MemoPanel/MemoPanel'
import CountdownPanel from './components/CountdownPanel/CountdownPanel'
import QuickAddButton from './components/QuickAddButton/QuickAddButton'
import WidgetCapsule from './components/WidgetMode/WidgetCapsule'
import SettingsPanel from './components/SettingsPanel/SettingsPanel'
import ToastContainer from './components/Toast/ToastContainer'
import type { ThemeMode } from '@shared/types'

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export default function App(): JSX.Element {
  const loaded = useAppStore((s) => s.loaded)
  const hydrate = useAppStore((s) => s.hydrate)
  const settings = useAppStore((s) => s.settings)
  const activeTab = useAppStore((s) => s.activeTab)
  const calendarViewMode = useAppStore((s) => s.calendarViewMode)
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const pushToast = useAppStore((s) => s.pushToast)

  const { isPanelVisible } = useWidgetMode()

  // 首次加载：从主进程拉取全部本地数据
  useEffect(() => {
    let cancelled = false
    window.api.data
      .getAll()
      .then((data) => {
        if (!cancelled) hydrate(data)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          pushToast({ title: '数据加载失败', body: err.message })
          // 加载失败时也要放开 loading 状态，展示一个可用的空白应用，而不是卡死在加载中
          hydrate({ todos: [], memos: [], countdowns: [], settings })
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 监听提醒推送
  useEffect(() => {
    const unsubscribe = window.api.reminder.onFire((payload) => {
      pushToast({
        title: '待办提醒',
        body: `${payload.title}${payload.time ? `（${payload.time}）` : ''}`,
        todoId: payload.todoId
      })
    })
    return unsubscribe
  }, [pushToast])

  // 主题与字体：写到 <html> 的 data-* 属性上，CSS 变量据此切换
  useEffect(() => {
    const theme = resolveTheme(settings.theme)
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-font', settings.fontSize)
  }, [settings.theme, settings.fontSize])

  // 背景不透明度：直接写 CSS 变量控制面板背景的 alpha 通道。
  // 100%（=1）时背景完全不透明、同时关掉毛玻璃模糊——
  // 既满足"要有完全不透明选项"的需求，文字也不会因为整体调暗而变得难读，
  // 顺带去掉持续合成模糊带来的性能开销。
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--panel-opacity', String(settings.opacity))
    root.style.setProperty('--panel-blur', settings.opacity >= 1 ? 'none' : 'blur(24px) saturate(160%)')
  }, [settings.opacity])

  // 跟随系统主题变化（仅当用户选择"跟随系统"时才需要监听）
  useEffect(() => {
    if (settings.theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (): void => document.documentElement.setAttribute('data-theme', media.matches ? 'dark' : 'light')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [settings.theme])

  if (!loaded) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>加载中…</span>
      </div>
    )
  }

  if (!isPanelVisible) {
    return (
      <div className="app-shell" style={{ background: 'transparent', boxShadow: 'none', border: 'none', backdropFilter: 'none' }}>
        <WidgetCapsule />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <TitleBar />
      <Header />
      <CalendarView />
      <div className="scroll-area">
        {calendarViewMode === 'year' ? (
          <YearView />
        ) : (
          <>
            {activeTab === 'today' && <TodayPanel />}
            {activeTab === 'todo' && <TodoPanel />}
            {activeTab === 'memo' && <MemoPanel />}
            {activeTab === 'countdown' && <CountdownPanel />}
          </>
        )}
      </div>
      <QuickAddButton />
      <TabBar />
      <ToastContainer />
      {settingsOpen && <SettingsPanel />}
    </div>
  )
}
