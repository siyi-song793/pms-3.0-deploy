/**
 * Layer3 中间件 - 全域读写权限拦截器
 * 强制规约：仅今日域可写入，所有只读域禁止写入API调用
 * 归档数据锁定拦截，杜绝历史数据篡改漏洞
 */
import { getLocalDateKey, getUTCNow } from '@common/utils/date'

export class ReadOnlyProxy {
  /** 拦截所有写入操作 */
  static writeInterceptor(target: any, prop: string) {
    return new Proxy(target, {
      set() {
        console.warn('[PMS3.0 权限拦截] 只读域禁止写入操作', prop)
        return false
      },
      deleteProperty() {
        console.warn('[PMS3.0 权限拦截] 只读域禁止删除操作', prop)
        return false
      }
    })
  }

  /** 校验是否允许写入：仅今日数据可写入 */
  static canWrite(dateKey: string): boolean {
    const today = getLocalDateKey(getUTCNow())
    // 非今日数据禁止写入
    if (dateKey !== today) return false
    return true
  }

  /** 归档数据锁定：12个月前数据永久只读 */
  static isArchived(ts: number): boolean {
    const twelveMonthAgo = Date.now() - 12 * 30 * 24 * 60 * 60 * 1000
    return ts < twelveMonthAgo
  }
}

/**
 * 写入API统一守卫，所有新增/更新/删除必须经过此校验
 */
export function writeGuard(dateKey: string, createTs: number): void {
  if (ReadOnlyProxy.isArchived(createTs)) {
    throw new Error('归档数据禁止修改，符合12个月锁定规约')
  }
  if (!ReadOnlyProxy.canWrite(dateKey)) {
    throw new Error('非今日数据禁止写入，请前往今日工作台操作')
  }
}
