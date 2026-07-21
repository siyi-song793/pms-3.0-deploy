// 原有的时序库代码...

export async function initTimeSeriesDB() {
  try {
    // 原有的初始化逻辑（连接数据库、创建表等）
    // ...
  } catch (err) {
    console.error('❌ 时序库初始化失败:', err)
    // 不抛出错误，让应用继续启动
    return Promise.resolve()
  }
}

import { getTimeDB } from "../../db/schema/init"
import type { TaskItem, WaterRecord } from '../../db/schema/tables'
import { writeGuard } from '../middleware/permission'
import { getLocalDateKey, getUTCNow } from '../../common/utils/date'

const STORE_NAME = 'tasks'

/** 获取当日所有任务 */
export async function getTodayTasks(dateKey: string): Promise<TaskItem[]> {
  const db = getTimeDB()
  const all = await db.getAllFromIndex(STORE_NAME, 'dateKey', dateKey)
  return all.filter(item => !item.isDeleted)
}

/** 获取月度所有任务统计 */
export async function getMonthAllTasks(year: number, month: number) {
  const db = getTimeDB()
  const all = await db.getAll(STORE_NAME)
  const filter = all.filter(item => {
    const [y, m] = item.dateKey.split('-').map(Number)
    return y === year && m === month && !item.isDeleted
  })

  const dateTaskMap: Record<string, {total:number,completed:number}> = {}
  const dayRateList: {day:number,rate:number}[] = []

  filter.forEach(item => {
    if (!dateTaskMap[item.dateKey]) {
      dateTaskMap[item.dateKey] = { total: 0, completed: 0 }
    }
    dateTaskMap[item.dateKey].total++
    if (item.isCompleted) dateTaskMap[item.dateKey].completed++
  })

  Object.entries(dateTaskMap).forEach(([key, val]) => {
    const day = Number(key.split('-')[2])
    const rate = val.total ? Math.round(val.completed / val.total * 100) : 0
    dayRateList.push({ day, rate })
  })

  return {
    totalCount: filter.length,
    completedCount: filter.filter(i => i.isCompleted).length,
    urgentCount: filter.filter(i => i.priority === 'urgent').length,
    completeRate: filter.length ? Math.round(filter.filter(i=>i.isCompleted).length / filter.length * 100) : 0,
    dateTaskMap,
    dayRateList
  }
}

/** 新建今日任务（唯一合法写入入口） */
export async function createTodayTask(
  _scope: 'today',
  payload: Omit<TaskItem, 'id'|'dateKey'|'createTime'|'updateTime'|'isDeleted'>
): Promise<number> {
  const dateKey = getLocalDateKey(getUTCNow())
  const now = getUTCNow()
  writeGuard(dateKey, now)

  const task: TaskItem = {
    ...payload,
    id: 0,
    dateKey,
    createTime: now,
    updateTime: now,
    isDeleted: false
  }

  const db = getTimeDB()
  return await db.add(STORE_NAME, task) as number
}

/** 更新任务完成状态 */
export async function toggleTaskComplete(id: number, status: boolean): Promise<void> {
  const db = getTimeDB()
  const task = await db.get(STORE_NAME, id)
  if (!task) return
  writeGuard(task.dateKey, task.createTime)
  task.isCompleted = status
  task.updateTime = getUTCNow()
  await db.put(STORE_NAME, task)
}

/** 软删除任务 */
export async function softDeleteTask(id: number): Promise<void> {
  const db = getTimeDB()
  const task = await db.get(STORE_NAME, id)
  if (!task) return
  writeGuard(task.dateKey, task.createTime)
  task.isDeleted = true
  task.updateTime = getUTCNow()
  await db.put(STORE_NAME, task)
}

/** 恢复回收站任务 */
export async function restoreRecycleTask(id: number): Promise<void> {
  const db = getTimeDB()
  const task = await db.get(STORE_NAME, id)
  if (!task) return
  writeGuard(task.dateKey, task.createTime)
  task.isDeleted = false
  task.updateTime = getUTCNow()
  await db.put(STORE_NAME, task)
}

/* ===== 饮水台账服务 ===== */
export async function getWaterByDate(dateKey: string): Promise<WaterRecord[]> {
  const db = await getTimeDB();
  return db.getAllFromIndex('waterRecords', 'dateKey', dateKey);
}

export async function createWaterRecord(data: Omit<WaterRecord, 'id'>): Promise<number> {
  const db = await getTimeDB();
  return db.add('waterRecords', { ...data, createTime: Date.now() });
}

export async function deleteWaterRecord(id: number): Promise<void> {
  const db = await getTimeDB();
  return db.delete('waterRecords', id);
}

export async function getWaterStats(startKey: string, endKey: string) {
  const db = await getTimeDB();
  const all = await db.getAll('waterRecords') as WaterRecord[];
  const filtered = all.filter(r => r.dateKey >= startKey && r.dateKey <= endKey);
  const total = filtered.reduce((s, r) => s + r.amount, 0);
  const dayMap: Record<string, number> = {};
  const catMap: Record<string, number> = {};
  const sceneMap: Record<string, number> = {};
  filtered.forEach(r => {
    dayMap[r.dateKey] = (dayMap[r.dateKey] || 0) + r.amount;
    catMap[r.category] = (catMap[r.category] || 0) + r.amount;
    sceneMap[r.scene] = (sceneMap[r.scene] || 0) + r.amount;
  });
  const days = Object.keys(dayMap).length || 1;
  const goalDays = Object.values(dayMap).filter(v => v >= 2000).length;
  const outsideAmount = sceneMap['outside'] || 0;
  return {
    total, dailyAvg: Math.round(total / days), days,
    goalDays, noGoalDays: days - goalDays,
    outsideRatio: total > 0 ? Math.round(outsideAmount / total * 100) : 0,
    dayMap, catMap, sceneMap, records: filtered
  };
}

export async function clearWaterByDate(dateKey: string): Promise<void> {
  const records = await getWaterByDate(dateKey);
  const db = await getTimeDB();
  await Promise.all(records.map(r => db.delete('waterRecords', r.id!)));
}