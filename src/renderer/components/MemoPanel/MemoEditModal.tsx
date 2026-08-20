import { useState } from 'react'
import Modal from '../common/Modal'
import TagInput from '../common/TagInput'
import formStyles from '../common/form.module.css'
import { useAppStore } from '../../store/useAppStore'
import type { Memo, MemoColor } from '@shared/types'
import { MEMO_COLOR_HEX } from '../../utils/todoUtils'

const COLORS: MemoColor[] = ['yellow', 'blue', 'green', 'pink', 'purple', 'gray']

export default function MemoEditModal({
  initial,
  defaultDate,
  quickMode = false,
  onClose
}: {
  initial?: Memo
  defaultDate?: string
  quickMode?: boolean
  onClose: () => void
}): JSX.Element {
  const addMemo = useAppStore((s) => s.addMemo)
  const editMemo = useAppStore((s) => s.editMemo)
  const deleteMemo = useAppStore((s) => s.deleteMemo)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [linkedDate, setLinkedDate] = useState(initial?.linkedDate ?? defaultDate ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [color, setColor] = useState<MemoColor>(initial?.color ?? 'yellow')
  const [pinned, setPinned] = useState(initial?.pinned ?? false)
  const [saving, setSaving] = useState(false)

  const canSave = title.trim().length > 0 || content.trim().length > 0

  async function handleSave(): Promise<void> {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const payload = {
        title: title.trim() || content.trim().slice(0, 20),
        content: content.trim(),
        linkedDate: linkedDate || null,
        tags,
        color,
        pinned
      }
      if (initial) {
        await editMemo({ ...initial, ...payload })
      } else {
        await addMemo(payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!initial) return
    await deleteMemo(initial.id)
    onClose()
  }

  return (
    <Modal
      title={quickMode ? '快速记录' : initial ? '编辑备忘录' : '新建备忘录'}
      onClose={onClose}
      footer={
        <>
          {initial && (
            <button className={formStyles.dangerBtn} onClick={handleDelete}>
              删除
            </button>
          )}
          <button className={formStyles.secondaryBtn} onClick={onClose}>
            取消
          </button>
          <button className={formStyles.primaryBtn} onClick={handleSave} disabled={!canSave || saving}>
            保存
          </button>
        </>
      }
    >
      {!quickMode && (
        <div className={formStyles.field}>
          <span className={formStyles.label}>标题</span>
          <input
            className={formStyles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题（可选，留空则取正文前几个字）"
          />
        </div>
      )}

      <div className={formStyles.field}>
        {!quickMode && <span className={formStyles.label}>正文</span>}
        <textarea
          className={formStyles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="随手记点什么……"
          autoFocus
          style={quickMode ? { minHeight: 120 } : undefined}
        />
      </div>

      {!quickMode && (
        <>
          <div className={formStyles.field}>
            <span className={formStyles.label}>关联日期（可选）</span>
            <input
              className={formStyles.input}
              type="date"
              value={linkedDate}
              onChange={(e) => setLinkedDate(e.target.value)}
            />
          </div>

          <div className={formStyles.field}>
            <span className={formStyles.label}>标签</span>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <div className={formStyles.field}>
            <span className={formStyles.label}>颜色</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: MEMO_COLOR_HEX[c],
                    border: color === c ? '2px solid var(--color-text)' : '2px solid transparent'
                  }}
                  aria-label={`颜色 ${c}`}
                />
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-base)' }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            置顶这条备忘录
          </label>
        </>
      )}
    </Modal>
  )
}
