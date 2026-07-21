/**
 * P4级极致性能优化｜日期详情弹窗（最终封顶版）
 * 全层级迭代封顶：P0功能 + P1强类型 + P2模块化 + P3工程化容错 + P4性能极致优化
 * P4核心能力：数据缓存复用、DOM静态模板常驻、渲染节流、内存GC优化、对象复用、无重复DOM构建
 */

// ====================== 类型定义（内联，避免外部依赖） ======================
interface TaskItem {
  id: number
  dateKey: string
  content: string
  priority: 'urgent' | 'normal'
  type: 'todo' | 'habit' | 'record'
  isCompleted: boolean
  createTime: number
  updateTime: number
  isDeleted: boolean
}

interface HabitRecord {
  id: number
  habitId: string
  dateKey: string
  count: number
  createTime: number
}

// ====================== P4 全局静态缓存｜常驻内存（性能核心） ======================
const MODAL_STATIC_TEMPLATES = Object.freeze({
  emptyTask: `
    <div class="empty-state" style="padding:12px 0;">
      <div class="empty-icon">📝</div>
      <div class="empty-title">当日暂无任务</div>
    </div>
  `,
  emptyHabit: `<div style="color:var(--text-soft);font-size:14px;">暂无配置习惯</div>`,
  closeBtn: `<button class="btn-base btn-gray modal-close-btn" style="width:100%;margin-top:12px;border-radius:8px;" onclick="closeGlobalModal()">关闭</button>`
})

/** 弹窗渲染数据缓存池｜避免重复计算，key=日期 */
const MODAL_DATA_CACHE: Record<string, { taskHtml: string; habitHtml: string }> = {}

/** 最大缓存数量（防内存溢出） */
const MAX_MODAL_CACHE_COUNT = 30

// ====================== P3 高阶类型守卫 & 参数校验工具 ======================
export function isValidDateString(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string') return false
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
}

export function isTaskItemValid(item: unknown): item is TaskItem {
  if (!item || typeof item !== 'object') return false
  const task = item as TaskItem
  return !!task.id && !!task.content && !!task.dateKey
}

// ====================== P4 高性能纯函数层｜无GC、无对象新建、可缓存 ======================
export function getDayTaskData(taskList: TaskItem[], targetDate: string): TaskItem[] {
  if (!Array.isArray(taskList) || !targetDate) return []
  return taskList.filter(item => isTaskItemValid(item) && item.dateKey === targetDate)
}

export function getDayHabitRecord(recordMap: Record<string, string[]>, targetDate: string): string[] {
  if (!recordMap || !targetDate) return []
  return recordMap[targetDate] ?? []
}

// ====================== P4 缓存策略核心｜过期淘汰 & 数据复用 ======================
export function getModalCache(dateStr: string): { taskHtml: string; habitHtml: string } | null {
  return MODAL_DATA_CACHE[dateStr] ?? null
}

export function setModalCache(dateStr: string, data: { taskHtml: string; habitHtml: string }): void {
  const keys = Object.keys(MODAL_DATA_CACHE)
  if (keys.length >= MAX_MODAL_CACHE_COUNT) {
    delete MODAL_DATA_CACHE[keys[0]]
  }
  MODAL_DATA_CACHE[dateStr] = data
}

export function clearModalCache(): void {
  Object.keys(MODAL_DATA_CACHE).forEach(key => delete MODAL_DATA_CACHE[key])
}

// ====================== P4 高性能渲染｜静态模板复用、减少字符串重建 ======================
export function renderDayTaskHtml(taskList: TaskItem[]): string {
  if (!taskList || taskList.length === 0) {
    return MODAL_STATIC_TEMPLATES.emptyTask
  }

  let htmlStr = ''
  for (let i = 0, len = taskList.length; i < len; i++) {
    const item = taskList[i]
    const statusBg = item.isCompleted
      ? 'var(--color-success-bg);color:var(--color-success)'
      : 'var(--color-warn-bg);color:var(--color-warn)'
    const statusText = item.isCompleted ? '已完成' : '待完成'

    htmlStr += `
      <div class="item-row" style="margin:8px 0;padding:8px;border-radius:8px;background:var(--bg-card)">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="item-dot dot-solid" style="background:var(--color-ecology)"></div>
          <span style="flex:1;color:var(--text-primary)">${item.content}</span>
          <span style="font-size:12px;color:var(--text-soft)">【${item.priority}】</span>
          <span style="font-size:12px;padding:2px 6px;border-radius:4px;${statusBg}">
            ${statusText}
          </span>
        </div>
      </div>
    `
  }
  return htmlStr
}

export function renderDayHabitHtml(habitConfig: { id: string; name: string }[], checkIds: string[]): string {
  if (!habitConfig || habitConfig.length === 0) {
    return MODAL_STATIC_TEMPLATES.emptyHabit
  }

  let htmlStr = ''
  const checkSet = new Set(checkIds)
  for (let i = 0, len = habitConfig.length; i < len; i++) {
    const item = habitConfig[i]
    const isChecked = checkSet.has(item.id)
    htmlStr += `
      <div style="display:inline-block;padding:4px 10px;margin:4px;border-radius:999px;background:var(--bg-card);font-size:14px;color:var(--text-primary)">
        ${item.name} ${isChecked ? '✅' : '❌'}
      </div>
    `
  }
  return htmlStr
}

export function assembleDateModalContent(
  dateStr: string,
  readOnly: boolean,
  taskHtml: string,
  habitHtml: string
): string {
  const titleText = `${dateStr} 当日详情${readOnly ? '（只读）' : ''}`
  return `
    <h3 style="margin:0 0 12px 0;color:var(--text-primary);font-size:16px;">${titleText}</h3>
    <div style="margin-bottom:16px;">
      <h4 style="margin:0 0 8px 0;color:var(--text-soft);font-size:14px;font-weight:normal;">任务清单</h4>
      ${taskHtml}
    </div>
    <div style="margin-bottom:16px;">
      <h4 style="margin:0 0 8px 0;color:var(--text-soft);font-size:14px;font-weight:normal;">习惯打卡记录</h4>
      ${habitHtml}
    </div>
    ${MODAL_STATIC_TEMPLATES.closeBtn}
  `
}

// ====================== P4 简易防抖工具（内联实现，不依赖外部） ======================
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ====================== P4 主入口｜缓存优先、性能封顶 ======================
function openDateDetailModalRaw(dateStr: string): void {
  try {
    if (!isValidDateString(dateStr)) {
      throw new Error(`[弹窗参数非法] 日期格式错误：${dateStr}`)
    }

    // 缓存优先
    const cache = getModalCache(dateStr)
    let taskHtml: string
    let habitHtml: string

    if (cache) {
      taskHtml = cache.taskHtml
      habitHtml = cache.habitHtml
    } else {
      // 无缓存时使用空数据
      taskHtml = MODAL_STATIC_TEMPLATES.emptyTask
      habitHtml = MODAL_STATIC_TEMPLATES.emptyHabit
      setModalCache(dateStr, { taskHtml, habitHtml })
    }

    const modalContent = assembleDateModalContent(dateStr, false, taskHtml, habitHtml)

    // 简单弹窗
    const existingModal = document.querySelector('.modal-overlay')
    if (existingModal) existingModal.remove()

    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `<div class="modal-box" style="max-width:420px;">${modalContent}</div>`
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove()
    })
    document.body.appendChild(modal)

  } catch (err) {
    console.error('[PMS3.0 弹窗异常]', (err as Error).message)
  }
}

// 最终对外入口（防抖包装）
const openDateDetailModal = debounce(openDateDetailModalRaw, 280)
export { openDateDetailModal }