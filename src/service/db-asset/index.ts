/**
 * @file 资产库DB服务层｜Layer3 数据服务层
 * @desc db_asset资产专属CRUD，与时序库物理隔离，禁止跨库直接访问
 */
import { getAssetDB } from "../../db/schema/init"
import type { AssetRecord, AssetCategory, AppSetting } from '../../db/schema/tables'

let assetDBCache: ReturnType<typeof getAssetDB> | null = null

async function getAssetDBInstance() {
  if (!assetDBCache) {
    assetDBCache = getAssetDB()
  }
  return assetDBCache
}

// ========== 资产流水记录CRUD ==========
export async function createAssetRecord(data: Omit<AssetRecord, 'id'|'createTime'>): Promise<number> {
  const db = await getAssetDBInstance()
  const tx = db.transaction('assets', 'readwrite')
  const store = tx.objectStore('assets')
  const id = await store.put({
    ...data,
    createTime: Date.now()
  } as AssetRecord)
  await tx.done
  return id as number
}

export async function getAssetRecordById(id: number): Promise<AssetRecord | undefined> {
  const db = await getAssetDBInstance()
  return db.transaction('assets', 'readonly').objectStore('assets').get(id)
}

export async function listAssetRecordsByDate(dateKey: string): Promise<AssetRecord[]> {
  const db = await getAssetDBInstance()
  return db.getAllFromIndex('assets', 'dateKey', dateKey)
}

export async function listAssetRecordsByRange(startKey: string, endKey: string): Promise<AssetRecord[]> {
  const db = await getAssetDBInstance()
  return db.getAllFromIndex('assets', 'dateKey', IDBKeyRange.bound(startKey, endKey))
}

export async function updateAssetRecord(id: number, payload: Partial<AssetRecord>): Promise<void> {
  const db = await getAssetDBInstance()
  const old = await getAssetRecordById(id)
  if (!old) throw new Error('资产记录不存在')
  const tx = db.transaction('assets', 'readwrite')
  await tx.objectStore('assets').put({ ...old, ...payload })
  await tx.done
}

export async function deleteAssetRecord(id: number): Promise<void> {
  const db = await getAssetDBInstance()
  const tx = db.transaction('assets', 'readwrite')
  await tx.objectStore('assets').delete(id)
  await tx.done
}

// ========== 资产分类CRUD ==========
export async function getAllAssetCategories(): Promise<AssetCategory[]> {
  const db = await getAssetDBInstance()
  return db.transaction('categories', 'readonly').objectStore('categories').getAll()
}

export async function saveAssetCategory(data: AssetCategory): Promise<string> {
  const db = await getAssetDBInstance()
  const tx = db.transaction('categories', 'readwrite')
  const id = await tx.objectStore('categories').put(data)
  await tx.done
  return id as string
}

// ========== 全局配置读写 ==========
export async function getAssetConfig(): Promise<AppSetting | null> {
  const db = await getAssetDBInstance()
  return db.transaction('settings', 'readonly').objectStore('settings').get('asset_config')
}

export async function setAssetConfig(value: Record<string, unknown>): Promise<void> {
  const db = await getAssetDBInstance()
  const tx = db.transaction('settings', 'readwrite')
  await tx.objectStore('settings').put({
    key: 'asset_config',
    value: JSON.stringify(value),
    updateTime: Date.now()
  })
  await tx.done
}

export async function getFinanceStats(startKey: string, endKey: string) {
  const db = await getAssetDBInstance();
  const all = await db.getAll('assets') as AssetRecord[];
  const filtered = all.filter(r => r.dateKey >= startKey && r.dateKey <= endKey);
  let income = 0, expense = 0;
  const dayMap: Record<string, {income: number, expense: number}> = {};
  const catMap: Record<string, number> = {};
  filtered.forEach(r => {
    if (r.type === 'income') { income += r.amount; dayMap[r.dateKey] = (dayMap[r.dateKey] || {income:0,expense:0}); dayMap[r.dateKey].income += r.amount; }
    else { expense += r.amount; dayMap[r.dateKey] = (dayMap[r.dateKey] || {income:0,expense:0}); dayMap[r.dateKey].expense += r.amount; }
    catMap[r.category] = (catMap[r.category] || 0) + r.amount;
  });
  return { income, expense, balance: income - expense, dayMap, catMap, records: filtered };
}