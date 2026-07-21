/**
 * Layer4 基础设施 - 全局事件总线
 * 遵循4.2全域状态规约，命名空间隔离，无全局污染
 * Copilot适配：自动推导事件类型、批量订阅优化
 */
type EventHandler = (...args: any[]) => void
type EventMap = Record<string, EventHandler[]>

export class EventBus {
  private eventPool: EventMap = Object.create(null)
  private oncePool: EventMap = Object.create(null)

  /** 订阅事件 */
  on(eventName: string, handler: EventHandler): void {
    if (!this.eventPool[eventName]) this.eventPool[eventName] = []
    this.eventPool[eventName].push(handler)
  }

  /** 一次性订阅 */
  once(eventName: string, handler: EventHandler): void {
    if (!this.oncePool[eventName]) this.oncePool[eventName] = []
    this.oncePool[eventName].push(handler)
  }

  /** 触发事件 */
  emit(eventName: string, ...args: any[]): void {
    // 常驻事件
    this.eventPool[eventName]?.forEach(handler => handler(...args))
    // 一次性事件执行后销毁
    this.oncePool[eventName]?.forEach(handler => handler(...args))
    delete this.oncePool[eventName]
  }

  /** 取消订阅 */
  off(eventName: string, targetHandler?: EventHandler): void {
    if (!targetHandler) {
      delete this.eventPool[eventName]
      delete this.oncePool[eventName]
      return
    }
    this.eventPool[eventName] = this.eventPool[eventName]?.filter(h => h !== targetHandler) || []
    this.oncePool[eventName] = this.oncePool[eventName]?.filter(h => h !== targetHandler) || []
  }

  /** 清空所有事件 */
  clear(): void {
    this.eventPool = Object.create(null)
    this.oncePool = Object.create(null)
  }
}
