/**
 * 小组件模式（收起态）的交互逻辑：
 * - collapsed = true 时，窗口是一个胶囊条，只展示摘要信息；
 * - 鼠标悬停时（hovering = true），临时把窗口 resize 成完整面板，展示全部内容；
 * - 鼠标移出后，如果开启了"自动收起"，延迟 500ms 收起（防止用户只是路过鼠标就抖动）；
 *   如果关闭了"自动收起"，则保持展开，直到用户点击"收起"按钮。
 */
import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

const COLLAPSE_DELAY_MS = 500

export function useWidgetMode(): { isPanelVisible: boolean } {
  const collapsed = useAppStore((s) => s.collapsed)
  const hovering = useAppStore((s) => s.hovering)
  const autoCollapseWidget = useAppStore((s) => s.settings.autoCollapseWidget)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasExpandedRef = useRef(false)

  const isPanelVisible = !collapsed || hovering

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (isPanelVisible && !wasExpandedRef.current) {
      window.api.window.expandWidget()
      wasExpandedRef.current = true
    } else if (!isPanelVisible && wasExpandedRef.current) {
      if (autoCollapseWidget) {
        timerRef.current = setTimeout(() => {
          window.api.window.collapseWidget()
          wasExpandedRef.current = false
        }, COLLAPSE_DELAY_MS)
      }
      // 关闭自动收起时，保持展开态，不调用 collapseWidget
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPanelVisible, autoCollapseWidget])

  return { isPanelVisible }
}
