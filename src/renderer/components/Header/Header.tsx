import { useAppStore } from '../../store/useAppStore'
import { formatMonthTitle, formatFullDate, getWeekDays, parseDateKey } from '../../utils/calendar'
import styles from './Header.module.css'

function computeTitle(mode: string, monthAnchor: Date, selectedDate: string): string {
  if (mode === 'month') return formatMonthTitle(monthAnchor)
  if (mode === 'day') return formatFullDate(parseDateKey(selectedDate))
  const days = getWeekDays(parseDateKey(selectedDate))
  const start = days[0]
  const end = days[6]
  const sameMonth = start.getMonth() === end.getMonth()
  const startLabel = `${start.getMonth() + 1}月${start.getDate()}日`
  const endLabel = sameMonth ? `${end.getDate()}日` : `${end.getMonth() + 1}月${end.getDate()}日`
  return `${startLabel} - ${endLabel}`
}

export default function Header(): JSX.Element {
  const monthAnchor = useAppStore((s) => s.monthAnchor)
  const selectedDate = useAppStore((s) => s.selectedDate)
  const calendarViewMode = useAppStore((s) => s.calendarViewMode)
  const setCalendarViewMode = useAppStore((s) => s.setCalendarViewMode)
  const goPrev = useAppStore((s) => s.goPrev)
  const goNext = useAppStore((s) => s.goNext)
  const goToToday = useAppStore((s) => s.goToToday)

  const title = computeTitle(calendarViewMode, monthAnchor, selectedDate)

  return (
    <div className={`${styles.header} drag-region`}>
      <div className={styles.left}>
        <button className={`${styles.navBtn} no-drag`} onClick={goPrev} aria-label="上一个">
          ‹
        </button>
        <span className={styles.title}>{title}</span>
        <button className={`${styles.navBtn} no-drag`} onClick={goNext} aria-label="下一个">
          ›
        </button>
      </div>
      <div className={`${styles.right} no-drag`}>
        <button className={styles.todayBtn} onClick={goToToday}>
          今天
        </button>
        <div className={styles.viewSwitch}>
          {(['month', 'week', 'day'] as const).map((m) => (
            <button
              key={m}
              className={`${styles.viewBtn} ${calendarViewMode === m ? styles.viewBtnActive : ''}`}
              onClick={() => setCalendarViewMode(m)}
            >
              {m === 'month' ? '月' : m === 'week' ? '周' : '日'}
            </button>
          ))}
        </div>
        <SettingsEntry />
      </div>
    </div>
  )
}

function SettingsEntry(): JSX.Element {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  return (
    <button className={styles.iconBtn} onClick={() => setSettingsOpen(true)} aria-label="设置" title="设置">
      ⚙
    </button>
  )
}
