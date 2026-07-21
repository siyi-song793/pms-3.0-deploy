/**
 * Layer5 持久化层 - 双库表结构定义
 * db_time：时序任务库｜db_asset：资产财务库，物理隔离无穿透
 * 严格遵循原文档五张核心表规约
 */

// 时序库：任务主表
export interface TaskItem {
  id: number
  dateKey: string
  content: string
  priority: 'urgent' | 'normal'
  type: 'todo' | 'habit' | 'record'
  isCompleted: boolean
  createTime: number
  updateTime: number
  isDeleted: boolean
  level?: 'day' | 'week' | 'month' | 'year'
  category1?: string
  category2?: string
  note?: string
  startTime?: string
  endTime?: string
}

// 时序库：习惯打卡明细表
export interface HabitRecord {
  id: number
  habitId: string
  dateKey: string
  count: number
  createTime: number
}

// 资产库：收支台账表
export interface AssetRecord {
  id: number
  dateKey: string
  type: 'income' | 'expense'
  amount: number
  category: string
  remark: string
  createTime: number
}

// 时序库：饮水记录表
export interface WaterRecord {
  id?: number;
  dateKey: string;
  category: 'pure' | 'tea' | 'coffee' | 'juice' | 'milktea' | 'dairy' | 'alcohol';
  scene: 'home' | 'outside';
  amount: number;
  createTime: number;
}

// 资产库：分类配置表
export interface AssetCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  sort: number
}

// 全局配置表（双库共用）
export interface AppSetting {
  key: string
  value: string | number | boolean
  updateTime: number
}

// 数据库名称常量
export const DB_TIME_NAME = 'pms_time_v3'
export const DB_ASSET_NAME = 'pms_asset_v3'
export const DB_VERSION = 3

// 对象仓库配置
export const TIME_STORES = {
  tasks: { keyPath: 'id', autoIncrement: true },
  habitRecords: { keyPath: 'id', autoIncrement: true },
  waterRecords: { keyPath: 'id', autoIncrement: true }
}

export const ASSET_STORES = {
  assets: { keyPath: 'id', autoIncrement: true },
  categories: { keyPath: 'id' },
  settings: { keyPath: 'key' }
}

// 索引配置：store 名 -> 索引字段名列表
// 修复 BUG：原工程未声明 dateKey 索引，导致 getAllFromIndex / IDBKeyRange.bound 查询全部抛错
export const TIME_INDEXES: Record<string, string[]> = {
  tasks: ['dateKey', 'level'],
  habitRecords: ['dateKey'],
  waterRecords: ['dateKey']
}

export const ASSET_INDEXES: Record<string, string[]> = {
  assets: ['dateKey']
}
