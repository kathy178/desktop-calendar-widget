import { useAppStore } from '../../store/useAppStore'
import {
  WEEKDAY_LABELS,
  getDayMeta,
  getMonthGridDays,
  getWeekDays,
  isSameDay,
  isSameMonth,
  isToday,
  parseDateKey,
  toDateKey
} from '../../utils/calendar'
import type { Memo, Todo } from '@shared/types'
import styles from './CalendarView.module.css'

interface DayDotInfo {
  hasTodo: boolean
  hasHighPriority: boolean
  hasMemo: boolean
}

function computeDotInfo(dateKey: string, todos: Todo[], memos: Memo[]): DayDotInfo {
  const dayTodos = todos.filter((t) => t.date === dateKey && !t.completed)
  const dayMemos = memos.filter((m) => m.linkedDate === dateKey)
  return {
    hasTodo: dayTodos.length > 0,
    hasHighPriority: dayTodos.some((t) => t.priority === 'high'),
    hasMemo: dayMemos.length > 0
  }
}

function DayCell({
  date,
  inCurrentMonth,
  compact
}: {
  date: Date
  inCurrentMonth: boolean
  compact?: boolean
}): JSX.Element {
  const todos = useAppStore((s) => s.todos)
  const memos = useAppStore((s) => s.memos)
  const selectedDate = useAppStore((s) => s.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)

  const dateKey = toDateKey(date)
  const meta = getDayMeta(date)
  const dots = computeDotInfo(dateKey, todos, memos)
  const selected = dateKey === selectedDate
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
}

function MonthView(): JSX.Element {
  const monthAnchor = useAppStore((s) => s.monthAnchor)
  const days = getMonthGridDays(monthAnchor)

  return (
    <div className={styles.monthGrid}>
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className={styles.weekdayLabel}>
          {label}
        </div>
      ))}
      {days.map((date) => (
        <DayCell key={date.toISOString()} date={date} inCurrentMonth={isSameMonth(date, monthAnchor)} />
      ))}
    </div>
  )
}

function WeekView(): JSX.Element {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const days = getWeekDays(parseDateKey(selectedDate))

  return (
    <div className={styles.weekGrid}>
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className={styles.weekdayLabel}>
          {label}
        </div>
      ))}
      {days.map((date) => (
        <DayCell key={date.toISOString()} date={date} inCurrentMonth compact />
      ))}
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

export default function CalendarView(): JSX.Element {
  const calendarViewMode = useAppStore((s) => s.calendarViewMode)

  return (
    <div className={styles.calendarView}>
      {calendarViewMode === 'month' && <MonthView />}
      {calendarViewMode === 'week' && <WeekView />}
      {calendarViewMode === 'day' && <DayView />}
    </div>
  )
}

export { isSameDay }
