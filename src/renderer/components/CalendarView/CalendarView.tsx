import { memo, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  WEEKDAY_LABELS,
  getDayMeta,
  getMonthGridDays,
  getWeekDays,
  isSameMonth,
  isToday,
  parseDateKey,
  toDateKey
} from '../../utils/calendar'
import { buildDotInfoMap, EMPTY_DOT_INFO, type DayDotInfo } from '../../utils/todoUtils'
import styles from './CalendarView.module.css'

const DayCell = memo(function DayCell({
  date,
  inCurrentMonth,
  compact,
  dots
}: {
  date: Date
  inCurrentMonth: boolean
  compact?: boolean
  dots: DayDotInfo
}): JSX.Element {
  const dateKey = toDateKey(date)
  // 只订阅"我是不是被选中"这一个布尔值，而不是整个 selectedDate 字符串——
  // 这样切换选中日期时，只有"原来选中的格子"和"新选中的格子"这 2 个格子会重渲染，
  // 而不是所有 42 个格子都重渲染。
  const selected = useAppStore((s) => s.selectedDate === dateKey)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)

  const meta = getDayMeta(date)
  const today = isToday(date)

  const subLabel = meta.holidayName
    ? meta.isRestDay
      ? meta.holidayName
      : '班'
    : meta.festivalText || meta.lunarText

  return (
    <button
      className={[
        styles.dayCell,
        !inCurrentMonth ? styles.dayCellFaded : '',
        selected ? styles.dayCellSelected : '',
        today ? styles.dayCellToday : '',
        compact ? styles.dayCellCompact : ''
      ].join(' ')}
      onClick={() => setSelectedDate(dateKey)}
    >
      <span className={styles.dayNumber}>{date.getDate()}</span>
      <span
        className={[
          styles.daySub,
          meta.holidayName && !meta.isRestDay ? styles.daySubWork : '',
          meta.holidayName && meta.isRestDay ? styles.daySubRest : ''
        ].join(' ')}
      >
        {subLabel}
      </span>
      <span className={styles.dotsRow}>
        {dots.hasTodo && (
          <span className={`${styles.dot} ${dots.hasHighPriority ? styles.dotDanger : styles.dotAccent}`} />
        )}
        {dots.hasMemo && <span className={`${styles.dot} ${styles.dotMuted}`} />}
      </span>
    </button>
  )
})

function MonthView(): JSX.Element {
  const monthAnchor = useAppStore((s) => s.monthAnchor)
  const todos = useAppStore((s) => s.todos)
  const memos = useAppStore((s) => s.memos)
  const days = useMemo(() => getMonthGridDays(monthAnchor), [monthAnchor])
  const dotInfoMap = useMemo(() => buildDotInfoMap(todos, memos), [todos, memos])

  return (
    <div className={styles.monthGrid}>
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className={styles.weekdayLabel}>
          {label}
        </div>
      ))}
      {days.map((date) => {
        const dateKey = toDateKey(date)
        return (
          <DayCell
            key={dateKey}
            date={date}
            inCurrentMonth={isSameMonth(date, monthAnchor)}
            dots={dotInfoMap.get(dateKey) ?? EMPTY_DOT_INFO}
          />
        )
      })}
    </div>
  )
}

function WeekView(): JSX.Element {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const todos = useAppStore((s) => s.todos)
  const memos = useAppStore((s) => s.memos)
  const days = useMemo(() => getWeekDays(parseDateKey(selectedDate)), [selectedDate])
  const dotInfoMap = useMemo(() => buildDotInfoMap(todos, memos), [todos, memos])

  return (
    <div className={styles.weekGrid}>
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className={styles.weekdayLabel}>
          {label}
        </div>
      ))}
      {days.map((date) => {
        const dateKey = toDateKey(date)
        return (
          <DayCell
            key={dateKey}
            date={date}
            inCurrentMonth
            compact
            dots={dotInfoMap.get(dateKey) ?? EMPTY_DOT_INFO}
          />
        )
      })}
    </div>
  )
}

function DayView(): JSX.Element {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const date = parseDateKey(selectedDate)
  const meta = getDayMeta(date)
  const today = isToday(date)

  return (
    <div className={styles.dayBanner}>
      <div className={[styles.dayBannerNumber, today ? styles.dayCellToday : ''].join(' ')}>{date.getDate()}</div>
      <div className={styles.dayBannerMeta}>
        <div>{meta.festivalText || meta.holidayName || '农历' + meta.lunarText}</div>
        {meta.holidayName && (
          <div className={meta.isRestDay ? styles.daySubRest : styles.daySubWork}>
            {meta.isRestDay ? '法定假日' : '调休上班'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalendarView(): JSX.Element | null {
  const calendarViewMode = useAppStore((s) => s.calendarViewMode)

  // 年视图不需要这个"固定高度的月/周/日格子区"，它自己就是主内容
  // （放在下方可滚动区域里，见 App.tsx），这里直接不渲染任何东西。
  if (calendarViewMode === 'year') return null

  return (
    <div className={styles.calendarView}>
      {calendarViewMode === 'month' && <MonthView />}
      {calendarViewMode === 'week' && <WeekView />}
      {calendarViewMode === 'day' && <DayView />}
    </div>
  )
}
