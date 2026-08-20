/**
 * 日期与农历/节假日相关的纯函数工具。
 *
 * 节假日/调休数据来自 lunar-javascript 内置的 HolidayUtil，
 * 该数据由库作者逐年维护更新——这意味着：
 *   1) 当前已发布的年份（写这段代码时覆盖到 2026 年）可以直接拿到准确的法定节假日 + 调休标记；
 *   2) 更远的未来年份（如 2027 及以后），在国务院正式发布放假安排前，库里还没有数据，
 *      届时只需升级 lunar-javascript 这个依赖包版本即可自动获得更新，不需要改动业务代码。
 */
import { Solar, HolidayUtil } from 'lunar-javascript'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday as isTodayFns,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'

export const DATE_FMT = 'yyyy-MM-dd'

export function toDateKey(date: Date): string {
  return format(date, DATE_FMT)
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function isToday(date: Date): boolean {
  return isTodayFns(date)
}

export { isSameDay, isSameMonth, addMonths, subMonths, addDays }

/** 获取月视图需要展示的完整日期格子（补齐上下月，保证 6 行 42 格，网格不跳动） */
export function getMonthGridDays(monthAnchor: Date): Date[] {
  const monthStart = startOfMonth(monthAnchor)
  const monthEnd = endOfMonth(monthAnchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  // 保证固定 42 格（6 周），避免某些月份只有 5 周导致高度跳动
  if (days.length < 42) {
    const last = days[days.length - 1]
    let cursor = last
    while (days.length < 42) {
      cursor = addDays(cursor, 1)
      days.push(cursor)
    }
  }
  return days
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 0 })
  const end = endOfWeek(anchor, { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

export interface DayMeta {
  lunarText: string
  festivalText: string | null
  holidayName: string | null
  isRestDay: boolean | null // true=法定假日休息，false=调休上班，null=无特殊安排
}

export function getDayMeta(date: Date): DayMeta {
  let lunarText = ''
  let festivalText: string | null = null
  try {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    lunarText = lunar.getDayInChinese()
    const solarFestivals = solar.getFestivals()
    const lunarFestivals = lunar.getFestivals()
    const jieQi = lunar.getJieQi()
    festivalText = solarFestivals[0] || lunarFestivals[0] || jieQi || null
    // 初一时显示"月名+初一"更直观，比如"七月"而不是仅"初一"
    if (lunar.getDayInChinese() === '初一') {
      lunarText = `${lunar.getMonthInChinese()}月`
    }
  } catch {
    lunarText = ''
  }

  let holidayName: string | null = null
  let isRestDay: boolean | null = null
  try {
    const key = toDateKey(date)
    const holiday = HolidayUtil.getHoliday(key)
    if (holiday) {
      holidayName = holiday.getName()
      isRestDay = !holiday.isWork()
    }
  } catch {
    holidayName = null
    isRestDay = null
  }

  return { lunarText, festivalText, holidayName, isRestDay }
}

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export function formatMonthTitle(date: Date): string {
  return format(date, 'yyyy年M月')
}

export function formatFullDate(date: Date): string {
  return format(date, 'yyyy年M月d日') + ' 星期' + WEEKDAY_LABELS[date.getDay()]
}
