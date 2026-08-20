import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { searchMemos, sortMemos } from '../../utils/todoUtils'
import MemoCard from './MemoCard'
import styles from './MemoPanel.module.css'

export default function MemoPanel(): JSX.Element {
  const memos = useAppStore((s) => s.memos)
  const [keyword, setKeyword] = useState('')

  const list = useMemo(() => sortMemos(searchMemos(memos, keyword)), [memos, keyword])

  return (
    <div className={styles.panel}>
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="搜索备忘录（标题 / 正文 / 标签）"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <span className="icon">✎</span>
          <span>{keyword ? '没有找到匹配的备忘录' : '还没有任何备忘录'}</span>
          {!keyword && <span style={{ fontSize: 'var(--font-sm)' }}>点击右下角「+」快速记录一条</span>}
        </div>
      ) : (
        <div className={styles.grid}>
          {list.map((memo) => (
            <MemoCard key={memo.id} memo={memo} />
          ))}
        </div>
      )}
    </div>
  )
}
