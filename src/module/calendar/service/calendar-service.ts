/**
 * @file 月历复盘服务层｜Layer3 数据服务层
 */
import { getTimeDB } from '../../../db/schema/init'
import type { TaskItem } from '../../../db/schema/tables'
import { getLocalDateKey } from '../../../common/utils/date'

export interface MonthGridCell {
  dateKey: string
  day: number
  isToday: boolean
  isCurrentMonth: boolean
  taskTotal: number
  taskCompleted: number
  completionRate: number
}

/** 获取月度所有原始任务 */
export async function getMonthRawTasks(year: number, month: number): Promise<TaskItem[]> {
  const startKey = `${year}-${String(month).padStart(2, '0')}-01`
  const endDay = new Date(year, month, 0).getDate()
  const endKey = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
  const db = getTimeDB()
  const tx = db.transaction('tasks', 'readonly')
  const idx = tx.objectStore('tasks').index('dateKey')
  const range = IDBKeyRange.bound(startKey, endKey)
  return idx.getAll(range)
}

/** 判断是否为归档月份 */
export function isArchivedMonth(year: number, month: number): boolean {
  const now = new Date()
  const diffMonth = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  return diffMonth >= 12
}