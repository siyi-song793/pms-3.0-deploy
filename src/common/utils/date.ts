/**
 * Layer4 工具 - 时间校准工具
 * 统一UTC/本地时间转换、周/月范围计算，全局时间唯一数据源
 */

/** 获取当前UTC时间戳 */
export function getUTCNow(): number {
  return Date.now()
}

/** 生成YYYY-MM-DD标准日期Key */
export function getLocalDateKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 获取指定时间所在周的起止时间戳（周一0点～周日24点） */
export function getWeekRange(ts: number): [number, number] {
  const d = new Date(ts)
  const day = d.getDay() || 7
  const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + 1, 0, 0, 0).getTime()
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000 - 1
  return [weekStart, weekEnd]
}

/** 获取指定时间所在月的起止时间戳+年月 */
export function getMonthRange(ts: number): [number, number, number, number] {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = d.getMonth()
  const monthStart = new Date(y, m, 1, 0, 0, 0).getTime()
  const monthEnd = new Date(y, m + 1, 0, 23, 59, 59).getTime()
  return [monthStart, monthEnd, y, m + 1]
}

/** 判断是否为同一天 */
export function isSameDay(ts1: number, ts2: number): boolean {
  return getLocalDateKey(ts1) === getLocalDateKey(ts2)
}
