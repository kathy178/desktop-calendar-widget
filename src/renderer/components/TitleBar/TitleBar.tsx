import { useAppStore } from '../../store/useAppStore'
import styles from './TitleBar.module.css'

export default function TitleBar(): JSX.Element {
  const setCollapsed = useAppStore((s) => s.setCollapsed)

  return (
    <div className={`${styles.bar} drag-region`}>
      <span className={styles.appName}>📅 桌面悬浮日历</span>
      <div className={`${styles.controls} no-drag`}>
        <button className={styles.ctrlBtn} onClick={() => setCollapsed(true)} title="收起为小组件">
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
