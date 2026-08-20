import { useState } from 'react'
import Modal from '../common/Modal'
import TagInput from '../common/TagInput'
import formStyles from '../common/form.module.css'
import { useAppStore } from '../../store/useAppStore'
import type { Priority, RepeatRule, Todo } from '@shared/types'
import { PRIORITY_LABEL } from '../../utils/todoUtils'

const REMINDER_OPTIONS = [
  { label: '不提醒', value: -1 },
  { label: '准点提醒', value: 0 },
  { label: '提前10分钟', value: 10 },
  { label: '提前30分钟', value: 30 },
  { label: '提前1小时', value: 60 }
]

const REPEAT_OPTIONS: { label: string; value: RepeatRule }[] = [
  { label: '不重复', value: 'none' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' }
]

export default function TodoEditModal({
  initial,
  defaultDate,
  onClose
}: {
  initial?: Todo
  defaultDate?: string
  onClose: () => void
}): JSX.Element {
  const addTodo = useAppStore((s) => s.addTodo)
  const editTodo = useAppStore((s) => s.editTodo)
  const deleteTodo = useAppStore((s) => s.deleteTodo)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? '')
  const [time, setTime] = useState(initial?.time ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [repeat, setRepeat] = useState<RepeatRule>(initial?.repeat ?? 'none')
  const [reminderMinutes, setReminderMinutes] = useState<number>(
    initial?.reminder?.enabled ? initial.reminder.minutesBefore : -1
  )
  const [saving, setSaving] = useState(false)

  const canSave = title.trim().length > 0

  async function handleSave(): Promise<void> {
    if (!canSave || saving) return
    setSaving(true)
    const reminder = reminderMinutes >= 0 ? { enabled: true, minutesBefore: reminderMinutes } : null
    try {
      if (initial) {
        await editTodo({
          ...initial,
          title: title.trim(),
          date: date || null,
          time: time || null,
          priority,
          tags,
          repeat,
          reminder,
          reminderFiredAt: null
        })
      } else {
        await addTodo({
          title: title.trim(),
          date: date || null,
          time: time || null,
          priority,
          tags,
          repeat,
          reminder,
          completed: false,
          completedAt: null
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!initial) return
    await deleteTodo(initial.id)
    onClose()
  }

  return (
    <Modal
      title={initial ? '编辑待办' : '新建待办'}
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
          placeholder="要做什么？"
          autoFocus
        />
      </div>

      <div className={formStyles.row} style={{ marginBottom: 14 }}>
        <div className={formStyles.field} style={{ marginBottom: 0 }}>
          <span className={formStyles.label}>日期</span>
          <input className={formStyles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className={formStyles.field} style={{ marginBottom: 0 }}>
          <span className={formStyles.label}>时间（可选）</span>
          <input className={formStyles.input} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>优先级</span>
        <div className={formStyles.segmented}>
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <button
              key={p}
              className={`${formStyles.segmentBtn} ${priority === p ? formStyles.segmentBtnActive : ''}`}
              onClick={() => setPriority(p)}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>标签</span>
        <TagInput tags={tags} onChange={setTags} placeholder="如：工作 / 生活 / 重要" />
      </div>

      <div className={formStyles.row} style={{ marginBottom: 14 }}>
        <div className={formStyles.field} style={{ marginBottom: 0 }}>
          <span className={formStyles.label}>重复</span>
          <select className={formStyles.select} value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatRule)}>
            {REPEAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className={formStyles.field} style={{ marginBottom: 0 }}>
          <span className={formStyles.label}>提醒</span>
          <select
            className={formStyles.select}
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(Number(e.target.value))}
            disabled={!date}
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!date && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-muted)' }}>未设置日期时无法开启提醒。</p>}
    </Modal>
  )
}
