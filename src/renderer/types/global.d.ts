import type { DesktopWidgetApi } from '@shared/preloadApi'

declare global {
  interface Window {
    api: DesktopWidgetApi
  }
}

export {}
