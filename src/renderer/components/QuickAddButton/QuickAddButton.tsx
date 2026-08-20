import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import TodoEditModal from '../TodoPanel/TodoEditModal'
import MemoEditModal from '../MemoPanel/MemoEditModal'
import CountdownEditModal from '../CountdownPanel/CountdownEditModal'
import styles from './QuickAddButton.module.css'

export default function QuickAddButton(): JSX.Element {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<'todo' | 'memo' | 'countdown' | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 点击菜单以外的任何地方，自动收起菜单，避免菜单一直悬在那里像卡住了一样
  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(e: MouseEvent): void {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} no-drag`}>
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
          <button
            className={styles.menuItem}
            onClick={() => {
              setMode('countdown')
              setMenuOpen(false)
            }}
          >
            ⏳ 新建倒数日
          </button>
        </div>
      )}
      <button className={styles.fab} onClick={() => setMenuOpen((v) => !v)} aria-label="新增">
        {menuOpen ? '×' : '+'}
      </button>

      {mode === 'todo' && <TodoEditModal defaultDate={selectedDate} onClose={() => setMode(null)} />}
      {mode === 'memo' && <MemoEditModal quickMode defaultDate={selectedDate} onClose={() => setMode(null)} />}
      {mode === 'countdown' && <CountdownEditModal onClose={() => setMode(null)} />}
    </div>
  )
}
