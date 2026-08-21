import { useMemo } from 'react'
import { getSeasonProgress, getYearProgress } from '../../utils/progressUtils'
import styles from './ProgressStrip.module.css'

export default function ProgressStrip(): JSX.Element {
  const { year, season } = useMemo(() => {
    const now = new Date()
    return { year: getYearProgress(now), season: getSeasonProgress(now) }
    // 只在组件挂载时算一次即可：进度按天变化，不需要每次渲染都重算，
    // 这个组件本身也会随应用其它状态更新而重渲染，避免重复的日期换算
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`${styles.strip} no-drag`}>
      <div className={styles.item}>
        <div className={styles.labelRow}>
          <span className={styles.name}>年度</span>
          <span>{Math.round(year.percent)}%</span>
        </div>
        <div className={styles.track}>
          <div className={`${styles.fill} ${styles.fillYear}`} style={{ width: `${year.percent}%` }} />
        </div>
      </div>
      <div className={styles.item}>
        <div className={styles.labelRow}>
          <span className={styles.name}>{season.label}季</span>
          <span>{Math.round(season.percent)}%</span>
        </div>
        <div className={styles.track}>
          <div className={`${styles.fill} ${styles.fillSeason}`} style={{ width: `${season.percent}%` }} />
        </div>
      </div>
    </div>
  )
}
