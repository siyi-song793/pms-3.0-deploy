/**
 * @file 周时间轴服务层｜Layer3 数据服务层
 * @desc 仅提供只读查询接口，禁止写入操作
 */
import { getTimeDB } from '../../../db/schema/init'
import type { TaskItem } from '../../../db/schema/tables'
import { getWeekRange, getLocalDateKey } from '../../../common/utils/date'

export interface WeekAggregateItem {
  dateKey: string
  total: number
  completed: number
  urgentPending: number
  tasks: TaskItem[]
}

/** 获取时间范围内原始任务 */
export async function getRawTasksInRange(startDateKey: string, endDateKey: string): Promise<TaskItem[]> {
  const db = getTimeDB()
  const tx = db.transaction('tasks', 'readonly')
  const idx = tx.objectStore('tasks').index('dateKey')
  const range = IDBKeyRange.bound(startDateKey, endDateKey)
  return idx.getAll(range)
}

/** 生成日期范围内所有日期key */
function getDateKeyBetween(startKey: string, endKey: string): string[] {
  const keys: string[] = []
  const start = new Date(startKey)
  const end = new Date(endKey)
  const dayMs = 24 * 60 * 60 * 1000
  for (let t = start.getTime(); t <= end.getTime(); t += dayMs) {
    keys.push(getLocalDateKey(t))
  }
  return keys
}

/** 聚合周维度任务数据 */
export async function getWeekAggregateTasks(weekStart: string, weekEnd: string): Promise<WeekAggregateItem[]> {
  const dateKeyList = getDateKeyBetween(weekStart, weekEnd)
  const allTasks = await getRawTasksInRange(weekStart, weekEnd)

  const aggregateMap = new Map<string, WeekAggregateItem>()
  dateKeyList.forEach(key => {
    aggregateMap.set(key, { dateKey: key, total: 0, completed: 0, urgentPending: 0, tasks: [] })
  })

  allTasks.forEach(task => {
    const item = aggregateMap.get(task.dateKey)
    if (!item) return
    item.tasks.push(task)
    item.total++
    if (task.isCompleted) item.completed++
    else if (task.priority === 'urgent') item.urgentPending++
  })

  return Array.from(aggregateMap.values())
}