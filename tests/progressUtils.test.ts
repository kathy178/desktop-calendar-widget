import { describe, expect, it } from 'vitest'
import { getSeasonProgress, getYearProgress } from '../src/renderer/utils/progressUtils'

describe('年度进度', () => {
  it('1月1日进度接近0', () => {
    const result = getYearProgress(new Date(2026, 0, 1))
    expect(result.dayOfYear).toBe(1)
    expect(result.totalDays).toBe(365)
    expect(result.percent).toBeCloseTo((1 / 365) * 100, 5)
  })

  it('12月31日进度是100%', () => {
    const result = getYearProgress(new Date(2026, 11, 31))
    expect(result.dayOfYear).toBe(365)
    expect(result.percent).toBeCloseTo(100, 5)
  })

  it('闰年正确识别为366天', () => {
    const result = getYearProgress(new Date(2028, 5, 15)) // 2028是闰年
    expect(result.totalDays).toBe(366)
  })

  it('平年是365天', () => {
    const result = getYearProgress(new Date(2026, 5, 15))
    expect(result.totalDays).toBe(365)
  })
})

describe('季度(S1/S2/S3)进度', () => {
  it('4月1日是S2的第1天', () => {
    const result = getSeasonProgress(new Date(2026, 3, 1))
    expect(result.label).toBe('S2')
    expect(result.dayIndex).toBe(1)
    expect(result.totalDays).toBe(30 + 31 + 30 + 31) // 4,5,6,7月天数
  })

  it('7月31日是S2的最后一天，进度100%', () => {
    const result = getSeasonProgress(new Date(2026, 6, 31))
    expect(result.label).toBe('S2')
    expect(result.percent).toBeCloseTo(100, 5)
  })

  it('8月1日是S3的第1天', () => {
    const result = getSeasonProgress(new Date(2026, 7, 1))
    expect(result.label).toBe('S3')
    expect(result.dayIndex).toBe(1)
  })

  it('11月30日是S3最后一天，进度100%', () => {
    const result = getSeasonProgress(new Date(2026, 10, 30))
    expect(result.label).toBe('S3')
    expect(result.percent).toBeCloseTo(100, 5)
  })

  it('12月属于S1，且跟明年1-3月是同一个季度', () => {
    const dec = getSeasonProgress(new Date(2026, 11, 1)) // 2026年12月1日
    expect(dec.label).toBe('S1')
    expect(dec.dayIndex).toBe(1)
    // S1总天数 = 12月(31) + 1月(31) + 2月(28,2027非闰年) + 3月(31) = 121
    expect(dec.totalDays).toBe(31 + 31 + 28 + 31)
  })

  it('次年1月属于上一年12月开始的那个S1，天数序号正确衔接', () => {
    const jan = getSeasonProgress(new Date(2027, 0, 1)) // 2027年1月1日，紧接着上面2026年12月1日
    expect(jan.label).toBe('S1')
    expect(jan.dayIndex).toBe(32) // 12月31天 + 1月1日 = 第32天
    expect(jan.totalDays).toBe(31 + 31 + 28 + 31)
  })

  it('3月31日是S1最后一天，进度100%', () => {
    const result = getSeasonProgress(new Date(2027, 2, 31))
    expect(result.label).toBe('S1')
    expect(result.percent).toBeCloseTo(100, 5)
  })

  it('跨年S1正确处理闰年2月（比如2028年2月29日）', () => {
    // 2027年12月开始的S1，跨到2028年2-3月，2028是闰年
    const result = getSeasonProgress(new Date(2028, 1, 29))
    expect(result.label).toBe('S1')
    expect(result.totalDays).toBe(31 + 31 + 29 + 31) // 12,1,2(闰),3月
  })
})
