/**
 * 小组件模式（收起态）的交互逻辑，以及与之绑定的"点击穿透"生效时机。
 *
 * 之前的版本依赖"鼠标悬停自动展开"，但这个机制会跟"点击展开"互相打架：
 * 小胶囊展开动画是"保持右边缘不动、向左/向下变大"，胶囊右侧的可点击区域
 * 跟展开后完整面板右上角的"收起"按钮几乎在同一块屏幕位置——鼠标一碰到胶囊，
 * 悬停立刻触发展开、窗口瞬间变大，但用户这一次点击还没结束，就会被换算到
 * 新出现的"收起"按钮上，导致展开又立刻收起，反复"闪烁"停不下来。
 *
 * 现在改成完全由"点击"这一个确定性动作驱动：
 * - 点小胶囊 -> setCollapsed(false) -> 展开
 * - 点完整面板顶部"收起"按钮 -> setCollapsed(true) -> 收起
 * 不再有任何基于鼠标悬停位置的自动展开/收起，也就没有了"点击跟 resize 抢跑"的竞争条件。
 */
import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useWidgetMode(): { isPanelVisible: boolean } {
  const collapsed = useAppStore((s) => s.collapsed)
  const clickThroughSetting = useAppStore((s) => s.settings.clickThrough)
  const wasExpandedRef = useRef(false)

  const isPanelVisible = !collapsed

  useEffect(() => {
    if (isPanelVisible && !wasExpandedRef.current) {
      window.api.window.expandWidget()
      wasExpandedRef.current = true
    } else if (!isPanelVisible && wasExpandedRef.current) {
      window.api.window.collapseWidget()
      wasExpandedRef.current = false
    }
  }, [isPanelVisible])

  // 点击穿透只在真正的收起小胶囊状态下生效，完整面板可见时（包括正在看设置）一律强制关闭，
  // 避免打开这个开关后把自己也点不到
  useEffect(() => {
    window.api.window.setClickThrough(!isPanelVisible && clickThroughSetting)
  }, [isPanelVisible, clickThroughSetting])

  return { isPanelVisible }
}
