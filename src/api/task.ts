/**
 * API 桥接层 - 重新导出数据服务层函数
 * 供 main.ts 等入口文件使用
 */
export {
  getTodayTasks,
  getMonthAllTasks,
  createTodayTask,
  softDeleteTask,
  toggleTaskComplete,
  restoreRecycleTask,
} from '../service/db-time/index'

export { getWaterByDate, createWaterRecord, deleteWaterRecord, getWaterStats, clearWaterByDate } from '../service/db-time/index'
export { listAssetRecordsByDate, createAssetRecord, deleteAssetRecord, getFinanceStats } from '../service/db-asset/index'