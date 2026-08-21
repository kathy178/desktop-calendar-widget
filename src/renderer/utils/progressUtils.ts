/**
 * 年度进度 / 季度（DJI 内部叫法 S1/S2/S3）进度计算。
 *
 * 季度规则（注意 S1 是跨自然年的）：
 *   S1：12月 ~ 次年3月（4个月）
 *   S2：4月 ~ 7月（4个月）
 *   S3：8月 ~ 11月（4个月）
 * 也就是说今年12月和明年1-3月算同一个 S1。
 */

export interface YearProgress {
  percent: number // 0-100
  dayOfYear: number
  totalDays: number
}

export type SeasonLabel = 'S1' | 'S2' | 'S3'

export interface SeasonProgress {
  label: SeasonLabel
  percent: number
  dayIndex: number
  totalDays: number
}

const MS_PER_DAY = 24 * 3600 * 1000

/** 去掉时分秒，只保留年月日，避免时区/夏令时导致的半天误差 */
function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getYearProgress(date: Date): YearProgress {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const startOfNextYear = new Date(year + 1, 0, 1)
  const totalDays = Math.round((startOfNextYear.getTime() - startOfYear.getTime()) / MS_PER_DAY)
  const dayOfYear = Math.round((stripTime(date).getTime() - startOfYear.getTime()) / MS_PER_DAY) + 1
  const percent = Math.min(100, Math.max(0, (dayOfYear / totalDays) * 100))
  return { percent, dayOfYear, totalDays }
}

export function getSeasonProgress(date: Date): SeasonProgress {
  const year = date.getFullYear()
  const month = date.getMonth() // 0=一月 ... 11=十二月

  let label: SeasonLabel
  let start: Date
  let endExclusive: Date

  if (month === 11) {
    // 12月：属于今年12月开始、明年3月结束的这个 S1
    label = 'S1'
    start = new Date(year, 11, 1)
    endExclusive = new Date(year + 1, 3, 1)
  } else if (month <= 2) {
    // 1-3月：属于去年12月开始、今年3月结束的那个 S1
    label = 'S1'
    start = new Date(year - 1, 11, 1)
    endExclusive = new Date(year, 3, 1)
  } else if (month <= 6) {
    // 4-7月
    label = 'S2'
    start = new Date(year, 3, 1)
    endExclusive = new Date(year, 7, 1)
  } else {
    // 8-11月
    label = 'S3'
    start = new Date(year, 7, 1)
    endExclusive = new Date(year, 11, 1)
  }

  const totalDays = Math.round((endExclusive.getTime() - start.getTime()) / MS_PER_DAY)
  const dayIndex = Math.round((stripTime(date).getTime() - start.getTime()) / MS_PER_DAY) + 1
  const percent = Math.min(100, Math.max(0, (dayIndex / totalDays) * 100))
  return { label, percent, dayIndex, totalDays }
}
