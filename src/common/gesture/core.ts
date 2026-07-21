/**
 * Layer4 基础设施 - 原生手势内核
 * 严格对齐原文档：滑动触发15px，滚动拦截30px阈值固化
 * 只读域手势拦截、输入区穿透屏蔽，无第三方手势库依赖
 */
type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down'

type GestureHandler = () => void

export class GestureCore {
  // 固化官方阈值，禁止修改
  public readonly SWIPE_THRESHOLD = 15
  public readonly SCROLL_LOCK_THRESHOLD = 30

  public excludeSelectors = 'input,textarea,.prevent-gesture'
  public blockWriteGesture = false

  private startX = 0
  private startY = 0
  private endX = 0
  private endY = 0
  private handlerMap: Record<GestureType, GestureHandler[]> = {
    'swipe-left': [],
    'swipe-right': [],
    'swipe-up': [],
    'swipe-down': []
  }

  mount() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true })
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
  }

  on(type: GestureType, handler: GestureHandler) {
    this.handlerMap[type].push(handler)
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    this.startX = touch.clientX
    this.startY = touch.clientY
  }

  private handleTouchMove(e: TouchEvent) {
    // 屏蔽指定DOM区域手势
    const target = e.target as HTMLElement
    if (target.matches(this.excludeSelectors)) return
    // 只读域阻止横向滚动穿透
    if (this.blockWriteGesture) {
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - this.startX)
      if (dx > this.SCROLL_LOCK_THRESHOLD) e.preventDefault()
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0]
    this.endX = touch.clientX
    this.endY = touch.clientY

    const dx = this.endX - this.startX
    const dy = this.endY - this.startY

    // 水平滑动判定
    if (Math.abs(dx) > this.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) this.handlerMap['swipe-left'].forEach(h => h())
      else this.handlerMap['swipe-right'].forEach(h => h())
    }
    // 垂直滑动判定
    if (Math.abs(dy) > this.SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) this.handlerMap['swipe-up'].forEach(h => h())
      else this.handlerMap['swipe-down'].forEach(h => h())
    }
  }
}