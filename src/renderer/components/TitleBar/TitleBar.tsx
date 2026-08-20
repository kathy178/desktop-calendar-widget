import { useAppStore } from '../../store/useAppStore'
import styles from './TitleBar.module.css'

export default function TitleBar(): JSX.Element {
  const setCollapsed = useAppStore((s) => s.setCollapsed)
  const setHovering = useAppStore((s) => s.setHovering)

  function handleCollapse(): void {
    // 同时把 hovering 重置为 false：点击这个按钮时鼠标物理上还停留在窗口内，
    // 如果不重置，isPanelVisible（= !collapsed || hovering）会因为 hovering 还是 true
    // 而继续判定为"应该展开"，导致点了收起没反应，要等鼠标真正移出去才生效。
    setCollapsed(true)
    setHovering(false)
  }

  return (
    <div className={`${styles.bar} drag-region`}>
      <span className={styles.appName}>📅 桌面悬浮日历</span>
      <div className={`${styles.controls} no-drag`}>
        <button className={styles.ctrlBtn} onClick={handleCollapse} title="收起为小组件">
          —
        </button>
        <button className={styles.ctrlBtn} onClick={() => window.api.window.minimize()} title="最小化到任务栏">
          🗕
        </button>
        <button className={`${styles.ctrlBtn} ${styles.closeBtn}`} onClick={() => window.api.window.close()} title="关闭">
          ×
        </button>
      </div>
    </div>
  )
}
