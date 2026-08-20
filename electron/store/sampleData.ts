/** 首次启动时的示例数据，帮助用户直观理解功能，而不是打开就是空白 */
import { genId } from '../../shared/id'
import type { CountdownEvent, Memo, Todo } from '../../shared/types'

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function buildSampleData(): { todos: Todo[]; memos: Memo[]; countdowns: CountdownEvent[] } {
  const now = new Date()
  const today = fmt(now)
  const tomorrow = fmt(new Date(now.getTime() + 24 * 3600 * 1000))
  const nowIso = now.toISOString()

  const todos: Todo[] = [
    {
      id: genId(),
      title: '欢迎使用桌面悬浮日历 —— 点击我可以编辑或完成',
      date: today,
      time: '09:30',
      priority: 'medium',
      tags: ['指引'],
      repeat: 'none',
      reminder: { enabled: true, minutesBefore: 10 },
      completed: false,
      completedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      reminderFiredAt: null
    },
    {
      id: genId(),
      title: '周会材料准备',
      date: today,
      time: '14:00',
      priority: 'high',
      tags: ['工作'],
      repeat: 'weekly',
      reminder: { enabled: true, minutesBefore: 15 },
      completed: false,
      completedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      reminderFiredAt: null
    },
    {
      id: genId(),
      title: '给自己倒杯水，起来走动一下',
      date: tomorrow,
      time: null,
      priority: 'low',
      tags: ['生活'],
      repeat: 'daily',
      reminder: null,
      completed: false,
      completedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      reminderFiredAt: null
    }
  ]

  const memos: Memo[] = [
    {
      id: genId(),
      title: '使用小提示',
      content:
        '右下角「+」可以快速新增待办或备忘录；把鼠标移到收起的小组件上会自动展开完整面板；设置里可以调整透明度、置顶和点击穿透。',
      linkedDate: null,
      tags: ['指引'],
      color: 'blue',
      pinned: true,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: genId(),
      title: '临时记录',
      content: '这是一条示例备忘录，可以随时编辑或删除。',
      linkedDate: today,
      tags: [],
      color: 'yellow',
      pinned: false,
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ]

  const oneHundredDaysAgo = fmt(new Date(now.getTime() - 100 * 24 * 3600 * 1000))
  const nextOct1 = new Date(now.getFullYear(), 9, 1) // 月份从0开始，9=10月
  if (nextOct1.getTime() < now.getTime()) nextOct1.setFullYear(nextOct1.getFullYear() + 1)

  const countdowns: CountdownEvent[] = [
    {
      id: genId(),
      title: '国庆节',
      targetDate: fmt(nextOct1),
      repeatYearly: true,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: genId(),
      title: '开始使用桌面悬浮日历（示例）',
      targetDate: oneHundredDaysAgo,
      repeatYearly: false,
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ]

  return { todos, memos, countdowns }
}
