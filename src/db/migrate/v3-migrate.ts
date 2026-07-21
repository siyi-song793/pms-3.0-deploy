/**
 * @file PMS2.0 => PMS3.0 增量数据迁移脚本
 * @desc Layer5 持久化层｜双库数据迁移、旧版本结构兼容、无损升级
 */
import { getTimeDB, getAssetDB } from '../schema/init'
import type { TaskItem, HabitRecord } from '../schema/tables'
import { NamespaceStorage } from '../../common/storage/namespace'

const LEGACY_NS = new NamespaceStorage('pms2_global_v2')
const NEW_NS = new NamespaceStorage('pms3_global_v3')

export interface MigrateLog {
  fromVersion: string
  toVersion: string
  timestamp: number
  taskCount: number
  habitCount: number
  error?: string
}

export async function runV2ToV3Migrate(): Promise<MigrateLog> {
  const migrateKey = 'migrate_v2_v3_completed'
  if (NEW_NS.get(migrateKey) === true) {
    return {
      fromVersion: '2.0',
      toVersion: '3.0',
      timestamp: Date.now(),
      taskCount: 0,
      habitCount: 0
    }
  }

  const log: MigrateLog = {
    fromVersion: '2.0',
    toVersion: '3.0',
    timestamp: Date.now(),
    taskCount: 0,
    habitCount: 0
  }

  try {
    const timeDB = getTimeDB()
    const assetDB = getAssetDB()

    const legacyTasks = LEGACY_NS.get<TaskItem[]>('time_tasks', [])
    if (legacyTasks?.length) {
      const tx = timeDB.transaction('tasks', 'readwrite')
      const store = tx.objectStore('tasks')
      for (const task of legacyTasks) {
        ;(task as any).migrateFrom = 'v2'
        task.updateTime = task.updateTime || task.createTime
        await store.put(task)
        log.taskCount++
      }
      await tx.done
    }

    const legacyHabits = LEGACY_NS.get<HabitRecord[]>('habit_records', [])
    if (legacyHabits?.length) {
      const tx = timeDB.transaction('habitRecords', 'readwrite')
      const store = tx.objectStore('habitRecords')
      for (const habit of legacyHabits) {
        ;(habit as any).migrateFrom = 'v2'
        await store.put(habit)
        log.habitCount++
      }
      await tx.done
    }

    const legacyAssetConfig = LEGACY_NS.get('asset_config', null)
    if (legacyAssetConfig) {
      const tx = assetDB.transaction('settings', 'readwrite')
      await tx.objectStore('settings').put(legacyAssetConfig)
      await tx.done
    }

    NEW_NS.set(migrateKey, true)
    return log
  } catch (err) {
    log.error = (err as Error).message
    console.error('[V3数据迁移失败]', err)
    throw new Error(`数据迁移异常: ${log.error}`)
  }
}

export function needMigrate(): boolean {
  return NEW_NS.get('migrate_v2_v3_completed') !== true
    && LEGACY_NS.has('time_tasks')
}