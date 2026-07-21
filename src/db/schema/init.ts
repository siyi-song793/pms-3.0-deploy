import { openDB, IDBPDatabase } from 'idb'
import {
  DB_TIME_NAME,
  DB_ASSET_NAME,
  DB_VERSION,
  TIME_STORES,
  ASSET_STORES,
  TIME_INDEXES,
  ASSET_INDEXES
} from './tables'

let dbTime: IDBPDatabase | null = null
let dbAsset: IDBPDatabase | null = null

/**
 * 创建或升级单个对象仓库，并补齐缺失索引
 * 修复 BUG：原实现只创建 store，未创建 dateKey 索引，导致 getAllFromIndex 抛错
 */
function ensureStoreAndIndexes(
  db: IDBPDatabase,
  name: string,
  opt: { keyPath?: string; autoIncrement?: boolean },
  indexes: string[],
  transaction: any
): void {
  let store: any
  if (!db.objectStoreNames.contains(name)) {
    store = db.createObjectStore(name, opt)
  } else if (transaction) {
    store = transaction.objectStore(name)
  }
  if (!store) return
  indexes.forEach((idx) => {
    if (!store.indexNames.contains(idx)) {
      store.createIndex(idx, idx, { unique: false })
    }
  })
}

/**
 * 初始化双IndexedDB数据库，Layer5底层唯一入口
 * 物理隔离时序库/资产库，禁止跨库直接访问
 */
/**
 * 带超时的 openDB 包装器，防止 IndexedDB 在某些环境（如 Electron BrowserView）中
 * 永远不触发 onsuccess/onerror 导致 Promise 挂起
 */
function openDBWithTimeout(
  name: string,
  version: number,
  upgrade: { upgrade: (db: any, oldV: number, newV: number, tx: any) => void },
  timeoutMs = 3000
): Promise<IDBPDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        console.warn(`[PMS3.0] ${name} 打开超时（${timeoutMs}ms），尝试关闭并重开`)
        // 尝试关闭被阻塞的连接
        try { indexedDB.deleteDatabase(name) } catch (_e) { /* ignore */ }
        reject(new Error(`IndexedDB ${name} 打开超时`))
      }
    }, timeoutMs)

    openDB(name, version, upgrade)
      .then(db => {
        if (!settled) { settled = true; clearTimeout(timer); resolve(db) }
      })
      .catch(err => {
        if (!settled) { settled = true; clearTimeout(timer); reject(err) }
      })
  })
}

export async function initDoubleDB(): Promise<void> {
  // 初始化时序任务库（带超时保护）
  try {
    dbTime = await openDBWithTimeout(DB_TIME_NAME, 3, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        Object.entries(TIME_STORES).forEach(([name, opt]) => {
          ensureStoreAndIndexes(db, name, opt, TIME_INDEXES[name] || [], transaction)
        })
      }
    })
  } catch (err) {
    console.warn('[PMS3.0] 时序库初始化异常，降级运行:', err)
  }

  // 初始化资产财务库（带超时保护）
  try {
    dbAsset = await openDBWithTimeout(DB_ASSET_NAME, 3, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        Object.entries(ASSET_STORES).forEach(([name, opt]) => {
          ensureStoreAndIndexes(db, name, opt, ASSET_INDEXES[name] || [], transaction)
        })
      }
    })
  } catch (err) {
    console.warn('[PMS3.0] 资产库初始化异常，降级运行:', err)
  }

  if (dbTime && dbAsset) {
    console.log('[PMS3.0] 双IndexedDB初始化完成｜物理隔离生效')
  } else {
    console.warn('[PMS3.0] 部分数据库未就绪，数据相关功能降级')
  }
}

export function getTimeDB() {
  if (!dbTime) throw new Error('时序库未初始化，请检查启动时序')
  return dbTime
}

export function getAssetDB() {
  if (!dbAsset) throw new Error('资产库未初始化，请检查启动时序')
  return dbAsset
}
