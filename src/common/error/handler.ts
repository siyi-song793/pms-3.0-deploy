/**
 * Layer4 基础设施 - 全局异常兜底处理器
 * 捕获同步/异步异常，防止应用白屏，上报Copilot异常分析
 */
export function globalErrorHandler(event: ErrorEvent | PromiseRejectionEvent): void {
  let msg = '未知运行时错误'
  if ('message' in event) {
    msg = event.message
  } else if ('reason' in event) {
    msg = event.reason?.message || '异步请求异常'
  }

  // 控制台打印，供Copilot分析
  console.error('[PMS3.0 GLOBAL ERROR]', msg, event)

  // 轻量兜底，不破坏页面结构
  const root = document.getElementById('app-root')
  if (!root) return
  if (!root.querySelector('.global-error-tip')) {
    const tip = document.createElement('div')
    tip.className = 'global-error-tip'
    tip.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;padding:12px;background:var(--color-danger-red);color:#fff;border-radius:10px;z-index:9999;font-size:14px;text-align:center;'
    tip.innerText = `运行异常：${msg}，刷新页面可恢复`
    root.appendChild(tip)
    // 3秒自动消失
    setTimeout(() => tip.remove(), 3000)
  }
}
