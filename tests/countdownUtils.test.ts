import { describe, expect, it } from 'vitest'
import { getCountdownDisplay, sortCountdowns } from '../src/renderer/utils/countdownUtils'
import type { CountdownEvent } from '../shared/types'

function makeCountdown(overrides: Partial<CountdownEvent> = {}): CountdownEvent {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: overrides.title ?? '测试倒数日',
    targetDate: overrides.targetDate ?? '2026-08-20',
    repeatYearly: overrides.repeatYearly ?? false,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString()
  }
}

describe('倒数日天数计算', () => {
  const today = new Date(2026, 7, 20, 10, 0, 0) // 2026-08-20

  it('未来日期显示"距离还有"，天数正确', () => {
    const item = makeCountdown({ targetDate: '2026-08-30' })
    const result = getCountdownDisplay(item, today)
    expect(result.direction).toBe('future')
    expect(result.days).toBe(10)
  })

  it('过去日期显示"已经过去"，天数正确', () => {
    const item = makeCountdown({ targetDate: '2026-08-10' })
    const result = getCountdownDisplay(item, today)
    expect(result.direction).toBe('past')
    expect(result.days).toBe(10)
  })

  it('就是今天时天数为0', () => {
    const item = makeCountdown({ targetDate: '2026-08-20' })
    const result = getCountdownDisplay(item, today)
    expect(result.direction).toBe('today')
    expect(result.days).toBe(0)
  })

  it('每年重复：今年的日期已过，自动换算到明年', () => {
    // 生日是 3月15日，现在是8月20日，今年的生日已经过了
    const item = makeCountdown({ targetDate: '2020-03-15', repeatYearly: true })
    const result = getCountdownDisplay(item, today)
    expect(result.direction).toBe('future')
    expect(result.effectiveDate).toBe('2027-03-15')
  })

  it('每年重复：今年的日期还没到，用今年的日期', () => {
    // 生日是 12月25日，现在是8月20日，今年的生日还没到
    const item = makeCountdown({ targetDate: '2020-12-25', repeatYearly: true })
    const result = getCountdownDisplay(item, today)
    expect(result.direction).toBe('future')
    expect(result.effectiveDate).toBe('2026-12-25')
  })

  it('每年重复：正好是今天', () => {
    const item = makeCountdown({ targetDate: '2019-08-20', repeatYearly: true })
    const result = getCountdownDisplay(item, today)
    expect(result.direction).toBe('today')
  })
})

describe('倒数日排序', () => {
  const today = new Date(2026, 7, 20, 10, 0, 0)

  it('今天 > 未来（越近越靠前）> 过去（越近越靠前）', () => {
    const items = [
      makeCountdown({ id: 'far-future', targetDate: '2026-09-20' }),
      makeCountdown({ id: 'today', targetDate: '2026-08-20' }),
      makeCountdown({ id: 'near-future', targetDate: '2026-08-25' }),
      makeCountdown({ id: 'near-past', targetDate: '2026-08-15' }),
      makeCountdown({ id: 'far-past', targetDate: '2026-07-01' })
    ]
    const sorted = sortCountdowns(items, today)
    expect(sorted.map((i) => i.id)).toEqual(['today', 'near-future', 'far-future', 'near-past', 'far-past'])
  })
})
