/**
 * 小组件模式（收起态）的交互逻辑，以及与之绑定的"点击穿透"生效时机。
 *
 * 状态转换规则：
 * 1. isPanelVisible 从 false -> true：展开窗口。
 * 2. isPanelVisible 从 true -> false，有两种截然不同的原因，处理方式不同：
 *    a) 是因为用户刚点了"收起为小组件"按钮（collapsed 刚变成 true）——
 *       这是明确的用户意图，不管"自动收起"开关状态如何，都应该立刻收起，不等待、不留情面。
 *    b) 是因为"鼠标悬停预览"结束了（hovering 刚变成 false，collapsed 本来就已经是 true）——
 *       这时候要看"自动收起"设置：开着就延迟 500ms 后收起（避免鼠标路过就抖动）；
 *       关着就把这次悬停"转正"为正式展开（setCollapsed(false)），
 *       否则会出现"窗口还是展开尺寸、但界面已经切换成收起态小胶囊"的错位画面。
 *
 * 点击穿透：只在"真正显示为收起小胶囊"（isPanelVisible === false）时才让它生效，
 * 只要完整面板可见（包括正在看设置页），一律强制关闭点击穿透——
 * 否则用户打开这个开关的下一秒，可能连"把它关掉"这个操作本身都点不到，把自己锁死在里面。
 */
import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

const COLLAPSE_DELAY_MS = 500

export function useWidgetMode(): { isPanelVisible: boolean } {
  const collapsed = useAppStore((s) => s.collapsed)
  const hovering = useAppStore((s) => s.hovering)
  const autoCollapseWidget = useAppStore((s) => s.settings.autoCollapseWidget)
  const clickThroughSetting = useAppStore((s) => s.settings.clickThrough)
  const setCollapsed = useAppStore((s) => s.setCollapsed)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasExpandedRef = useRef(false)
  const prevCollapsedRef = useRef(collapsed)

  const isPanelVisible = !collapsed || hovering

  useEffect(() => {
    const collapsedJustChanged = prevCollapsedRef.current !== collapsed
    prevCollapsedRef.current = collapsed

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (isPanelVisible) {
      if (!wasExpandedRef.current) {
        window.api.window.expandWidget()
        wasExpandedRef.current = true
      }
      return
    }

    // isPanelVisible === false 以下逻辑
    if (!wasExpandedRef.current) return // 本来就是收起态，不用做任何事

    if (collapsedJustChanged) {
      // 用户刚显式点了"收起"按钮：无条件立即收起，不受"自动收起"开关影响
      window.api.window.collapseWidget()
      wasExpandedRef.current = false
      return
    }

    // 走到这里说明：collapsed 本来就是 true，这次是"悬停预览"结束了（hovering 变成 false）
    if (autoCollapseWidget) {
      timerRef.current = setTimeout(() => {
        window.api.window.collapseWidget()
        wasExpandedRef.current = false
      }, COLLAPSE_DELAY_MS)
    } else {
      setCollapsed(false)
    }
  }, [isPanelVisible, collapsed, autoCollapseWidget, setCollapsed])

  // 点击穿透只在真正的收起小胶囊状态下生效
  useEffect(() => {
    window.api.window.setClickThrough(!isPanelVisible && clickThroughSetting)
  }, [isPanelVisible, clickThroughSetting])

  return { isPanelVisible }
}
