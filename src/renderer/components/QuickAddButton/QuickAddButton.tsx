import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import TodoEditModal from '../TodoPanel/TodoEditModal'
import MemoEditModal from '../MemoPanel/MemoEditModal'
import styles from './QuickAddButton.module.css'

export default function QuickAddButton(): JSX.Element {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<'todo' | 'memo' | null>(null)

  return (
    <div className={`${styles.wrapper} no-drag`}>
      {menuOpen && (
        <div className={styles.menu}>
          <button
            className={styles.menuItem}
            onClick={() => {
              setMode('todo')
              setMenuOpen(false)
            }}
          >
            ✓ 新建待办
          </button>
          <button
            className={styles.menuItem}
            onClick={() => {
              setMode('memo')
              setMenuOpen(false)
            }}
          >
            ✎ 快速记录
          </button>
        </div>
      )}
      <button className={styles.fab} onClick={() => setMenuOpen((v) => !v)} aria-label="新增">
        {menuOpen ? '×' : '+'}
      </button>

      {mode === 'todo' && <TodoEditModal defaultDate={selectedDate} onClose={() => setMode(null)} />}
      {mode === 'memo' && <MemoEditModal quickMode defaultDate={selectedDate} onClose={() => setMode(null)} />}
    </div>
  )
}
