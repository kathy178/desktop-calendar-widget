/**
 * lunar-javascript 未提供官方 TypeScript 类型声明，这里只声明我们实际用到的最小子集，
 * 避免在 strict 模式下到处出现 any。
 */
declare module 'lunar-javascript' {
  export class Lunar {
    getMonthInChinese(): string
    getDayInChinese(): string
    getFestivals(): string[]
    getJieQi(): string
  }

  export class Solar {
    static fromDate(date: Date): Solar
    getLunar(): Lunar
    getFestivals(): string[]
  }

  export class Holiday {
    getName(): string
    isWork(): boolean
    getTarget(): string
  }

  export class HolidayUtil {
    static getHoliday(dateStr: string): Holiday | null
  }
}
