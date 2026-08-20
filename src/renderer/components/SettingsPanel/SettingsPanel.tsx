import type { ReactNode } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { FontSize, ThemeMode } from '@shared/types'
import styles from './SettingsPanel.module.css'

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
]

const FONT_OPTIONS: { label: string; value: FontSize }[] = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

export default function SettingsPanel(): JSX.Element {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const pushToast = useAppStore((s) => s.pushToast)

  async function handleExport(): Promise<void> {
    const result = await window.api.backup.export()
    if (result.ok) {
      pushToast({ title: '导出成功', body: `已保存到：${result.path}` })
    } else if (result.error && result.error !== '已取消') {
      pushToast({ title: '导出失败', body: result.error })
    }
  }

  async function handleImport(): Promise<void> {
    const result = await window.api.backup.import()
    if (result.ok) {
      window.location.reload()
    } else if (result.error && result.error !== '已取消') {
      pushToast({ title: '导入失败', body: result.error })
    }
  }

  return (
    <div className={`${styles.panel} no-drag`}>
      <div className={`${styles.header} drag-region`}>
        <button className={`${styles.backBtn} no-drag`} onClick={() => setSettingsOpen(false)}>
          ‹ 返回
        </button>
        <span className={styles.title}>设置</span>
        <span style={{ width: 40 }} />
      </div>

      <div className={styles.body}>
        <Section title="窗口行为">
          <Row label="始终置顶">
            <Switch checked={settings.alwaysOnTop} onChange={(v) => updateSettings({ alwaysOnTop: v })} />
          </Row>
          <Row label="开机自启动">
            <Switch checked={settings.autoLaunch} onChange={(v) => updateSettings({ autoLaunch: v })} />
          </Row>
          <Row label="鼠标移出后自动收起小组件">
            <Switch
              checked={settings.autoCollapseWidget}
              onChange={(v) => updateSettings({ autoCollapseWidget: v })}
            />
          </Row>
          <Row label="点击穿透（收起为小组件时，鼠标可穿过它点击后面的内容）">
            <Switch checked={settings.clickThrough} onChange={(v) => updateSettings({ clickThrough: v })} />
          </Row>
        </Section>

        <Section title="外观">
          <Row label="主题">
            <select
              className={styles.select}
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as ThemeMode })}
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="字体大小">
            <select
              className={styles.select}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value as FontSize })}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label={`背景不透明度（${Math.round(settings.opacity * 100)}%，100% = 完全不透明）`}>
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={(e) => {
                const v = Number(e.target.value)
                updateSettings({ opacity: v })
              }}
            />
          </Row>
        </Section>

        <Section title="提醒">
          <Row label="启用待办提醒">
            <Switch checked={settings.reminderEnabled} onChange={(v) => updateSettings({ reminderEnabled: v })} />
          </Row>
        </Section>

        <Section title="数据">
          <Row label="导出为 JSON 文件">
            <button className={styles.actionBtn} onClick={handleExport}>
              导出
            </button>
          </Row>
          <Row label="从 JSON 文件恢复（将覆盖当前数据）">
            <button className={styles.actionBtn} onClick={handleImport}>
              导入
            </button>
          </Row>
        </Section>

        <div className={styles.footer}>桌面悬浮日历 v1.0.0 · 数据保存在本地，不会上传到任何服务器</div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      {children}
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <button
      className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className={styles.switchDot} />
    </button>
  )
}
