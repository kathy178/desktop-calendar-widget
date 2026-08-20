import { useAppStore } from '../../store/useAppStore'
import { isDueToday, isOverdue } from '../../utils/todoUtils'
import type { AppTab } from '@shared/types'
import styles from './TabBar.module.css'

const TABS: { key: AppTab; label: string; icon: string }[] = [
  { key: 'today', label: '今日', icon: '☀' },
  { key: 'todo', label: '待办', icon: '✓' },
  { key: 'memo', label: '备忘录', icon: '✎' },
  { key: 'countdown', label: '倒数日', icon: '⏳' }
]

export default function TabBar(): JSX.Element {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const todos = useAppStore((s) => s.todos)

  const now = new Date()
  const pendingCount = todos.filter((t) => !t.completed && (isDueToday(t, now) || isOverdue(t, now))).length

  return (
    <div className={`${styles.tabBar} no-drag`}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab(tab.key)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.key === 'todo' && pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
        </button>
      ))}
    </div>
  )
}
