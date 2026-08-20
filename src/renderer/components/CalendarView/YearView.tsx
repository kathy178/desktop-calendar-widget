import { memo, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getMonthGridDays, isSameMonth, isToday, toDateKey } from '../../utils/calendar'
import { buildDotInfoMap, EMPTY_DOT_INFO, type DayDotInfo } from '../../utils/todoUtils'
import styles from './YearView.module.css'

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const MiniMonth = memo(function MiniMonth({
  year,
  monthIndex,
  dotInfoMap
}: {
  year: number
  monthIndex: number
  dotInfoMap: Map<string, DayDotInfo>
}): JSX.Element {
  const monthAnchorForThis = useMemo(() => new Date(year, monthIndex, 1), [year, monthIndex])
  const days = useMemo(() => getMonthGridDays(monthAnchorForThis), [monthAnchorForThis])
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setCalendarViewMode = useAppStore((s) => s.setCalendarViewMode)

  function jumpToMonth(): void {
    setSelectedDate(toDateKey(monthAnchorForThis))
    setCalendarViewMode('month')
  }

  function jumpToDay(date: Date): void {
    setSelectedDate(toDateKey(date))
    setCalendarViewMode('month')
  }

  return (
    <div className={styles.miniMonth}>
      <button className={styles.miniMonthLabel} onClick={jumpToMonth}>
        {MONTH_LABELS[monthIndex]}
      </button>
      <div className={styles.miniGrid}>
        {days.map((date) => {
          const dateKey = toDateKey(date)
          const inMonth = isSameMonth(date, monthAnchorForThis)
          const today = isToday(date)
          const dots = dotInfoMap.get(dateKey) ?? EMPTY_DOT_INFO
          return (
            <button
              key={dateKey}
              className={[
                styles.miniDay,
                !inMonth ? styles.miniDayFaded : '',
                today ? styles.miniDayToday : ''
              ].join(' ')}
              onClick={() => jumpToDay(date)}
            >
              {date.getDate()}
              {(dots.hasTodo || dots.hasMemo) && <span className={styles.miniDot} />}
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default function YearView(): JSX.Element {
  const monthAnchor = useAppStore((s) => s.monthAnchor)
  const todos = useAppStore((s) => s.todos)
  const memos = useAppStore((s) => s.memos)
  const year = monthAnchor.getFullYear()

  const dotInfoMap = useMemo(() => buildDotInfoMap(todos, memos), [todos, memos])

  return (
    <div className={styles.yearGrid}>
      {MONTH_LABELS.map((_, monthIndex) => (
        <MiniMonth key={monthIndex} year={year} monthIndex={monthIndex} dotInfoMap={dotInfoMap} />
      ))}
    </div>
  )
}
