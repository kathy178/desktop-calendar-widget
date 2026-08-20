import { useState } from 'react'
import Modal from '../common/Modal'
import formStyles from '../common/form.module.css'
import { useAppStore } from '../../store/useAppStore'
import { toDateKey } from '../../utils/calendar'
import type { CountdownEvent } from '@shared/types'

export default function CountdownEditModal({
  initial,
  onClose
}: {
  initial?: CountdownEvent
  onClose: () => void
}): JSX.Element {
  const addCountdown = useAppStore((s) => s.addCountdown)
  const editCountdown = useAppStore((s) => s.editCountdown)
  const deleteCountdown = useAppStore((s) => s.deleteCountdown)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? toDateKey(new Date()))
  const [repeatYearly, setRepeatYearly] = useState(initial?.repeatYearly ?? false)
  const [saving, setSaving] = useState(false)

  const canSave = title.trim().length > 0 && targetDate.length > 0

  async function handleSave(): Promise<void> {
    if (!canSave || saving) return
    setSaving(true)
    try {
      if (initial) {
        await editCountdown({ ...initial, title: title.trim(), targetDate, repeatYearly })
      } else {
        await addCountdown({ title: title.trim(), targetDate, repeatYearly })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!initial) return
    await deleteCountdown(initial.id)
    onClose()
  }

  return (
    <Modal
      title={initial ? '编辑倒数日' : '新建倒数日'}
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
      <div className={formStyles.field}>
        <span className={formStyles.label}>标题</span>
        <input
          className={formStyles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：生日、纪念日、项目截止日"
          autoFocus
        />
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>目标日期</span>
        <input
          className={formStyles.input}
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-base)' }}>
        <input type="checkbox" checked={repeatYearly} onChange={(e) => setRepeatYearly(e.target.checked)} />
        每年重复（生日、纪念日这类可以勾选，到期后自动换算到下一年）
      </label>
    </Modal>
  )
}
