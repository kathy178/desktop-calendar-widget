import type { CountdownEvent } from '@shared/types'
import { parseDateKey, toDateKey } from './calendar'

export interface CountdownDisplay {
  /** 距离目标日期的天数，始终 >= 0 */
  days: number
  direction: 'future' | 'past' | 'today'
  /** 实际用于展示的目标日期（重复类会自动换算成"下一次出现的日期"） */
  effectiveDate: string
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 3600 * 1000
  // 用本地日期的年月日重新构造，避免夏令时/时区带来的 23/25 小时误差导致天数算错
  const clean = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((clean(b) - clean(a)) / MS_PER_DAY)
}

export function getCountdownDisplay(item: CountdownEvent, today: Date): CountdownDisplay {
  let target = parseDateKey(item.targetDate)

  if (item.repeatYearly) {
    // 每年重复的（生日/纪念日）：如果今年的这一天已经过去了，就换算成明年的日期，
    // 让"倒数日"永远是指向"下一次"，而不是显示一个已经过去的天数。
    const candidate = new Date(today.getFullYear(), target.getMonth(), target.getDate())
    if (daysBetween(today, candidate) < 0) {
      candidate.setFullYear(candidate.getFullYear() + 1)
    }
    target = candidate
  }

  const diff = daysBetween(today, target)
  const direction = diff === 0 ? 'today' : diff > 0 ? 'future' : 'past'

  return {
    days: Math.abs(diff),
    direction,
    effectiveDate: toDateKey(target)
  }
}

export function sortCountdowns(items: CountdownEvent[], today: Date): CountdownEvent[] {
  return [...items].sort((a, b) => {
    const da = getCountdownDisplay(a, today)
    const db_ = getCountdownDisplay(b, today)
    // 排序优先级：今天 > 未来（越近越靠前）> 过去（越近越靠前）
    const rank = (d: CountdownDisplay): number => (d.direction === 'today' ? 0 : d.direction === 'future' ? 1 : 2)
    const rankDiff = rank(da) - rank(db_)
    if (rankDiff !== 0) return rankDiff
    return da.days - db_.days
  })
}
