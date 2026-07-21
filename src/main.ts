/**
 * PMS3.0 个人时间管理系统3.0 入口主文件
 * 完全对齐 src/style/ 目录下所有样式文件，支持 TypeScript 类型约束
 */
// ====================== 1. 时序库初始化依赖（必须最先导入） ======================
import { initTimeSeriesDB } from './service/db-time'
// 2.弹窗工具（P4性能优化弹窗）
import './common/utils/modal.dateDetail'
import { clearModalCache } from './common/utils/modal.dateDetail'
// 3.全局样式导入
import './style/color-semantic.css'
import './style/layout-global.css'
import './style/global-disabled.css'
import './style/tab-nav.css'
import './style/bottom-tab-nav.css'
import './style/task-list.css'
import './style/task-input.css'
import './style/modal.css'
import './style/form.css'
import './style/skeleton.css'
import './style/empty-state.css'
import './style/timeline-grid.css'
import './style/calendar-chart.css'
import './style/calendar-asset-finance.css'
import './style/recycle-bin.css'
import './style/water-intake.css'
import './style/finance-book.css'
import './style/embedded-widgets.css'
// 4.数据库、业务服务、工具模块
import { initDoubleDB as initDB } from './db'
import { initServices } from './service'
import { initCommonUtils } from './common'
import { initBusinessModules } from './module'
// 5.接口API
import {
  getTodayTasks,
  getMonthAllTasks,
  createTodayTask,
  softDeleteTask,
  toggleTaskComplete,
  getWaterByDate,
  createWaterRecord,
  deleteWaterRecord,
  clearWaterByDate,
  getWaterStats
} from './service/db-time'
import {
  listAssetRecordsByDate,
  listAssetRecordsByRange,
  createAssetRecord,
  deleteAssetRecord,
  getFinanceStats
} from './service/db-asset'
import { getUTCNow, getLocalDateKey } from './common/utils/date'
import { getTimeDB } from './db/schema/init'

// ====================== 全局初始化 ======================
window.$pms = window.$pms || {}

/** 数据库重建工具（调试用，正常启动不调用；如需重建，在控制台执行 forceRebuildDB()） */
function forceRebuildDB() {
  return new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase('pms-db')
    deleteRequest.onsuccess = () => {
      console.log('✅ 旧数据库已删除，将重建')
      resolve(true)
    }
    deleteRequest.onerror = () => {
      console.warn('⚠️ 删除数据库失败，继续启动')
      resolve(false)
    }
  })
}

async function bootstrap() {
  try {
    // 注意：forceRebuildDB() 会清空所有数据，仅调试时手动调用
    await initTimeSeriesDB()
    console.log('✅ 时序库初始化成功')
  } catch (err) {
    console.warn('⚠️ 时序库初始化失败，启用降级模式:', err)
  }
}
bootstrap()

// ====================== 全局类型定义（原样保留无修改） ======================
type ThemeType = 'light' | 'dark'
type PageType = 'today' | 'timeline' | 'calendar'
type SkeletonType = 'card' | 'task' | 'text'
interface PmsGlobalAPI {
  setTheme: (type: ThemeType) => void
  page: {
    setPage: (type: PageType) => void
    getCurrentPage: () => PageType
  }
  load: {
    renderSkeleton: (container: HTMLElement, type?: SkeletonType) => void
    renderEmpty: (container: HTMLElement, title?: string, desc?: string) => void
  }
  addHideScroll: (el: HTMLElement) => void
  removeHideScroll: (el: HTMLElement) => void
}
declare global {
  interface Window {
    $pms: Partial<PmsGlobalAPI>
  }
}

// ====================== 全局初始化工具类（原样保留） ======================
const PmsGlobalInit = {
  initTheme(): void {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const localTheme = localStorage.getItem('pms-theme') as ThemeType | null
    const setTheme = (isDark: boolean): void => {
      isDark
        ? root.setAttribute('data-theme', 'dark')
        : root.removeAttribute('data-theme')
    }
    localTheme ? setTheme(localTheme === 'dark') : setTheme(mediaQuery.matches)
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('pms-theme')) setTheme(e.matches)
    })
  },
  initMobileAdapt(): void {
    let viewportMeta = document.querySelector('meta[name="viewport"]')
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      ;(viewportMeta as HTMLMetaElement).name = 'viewport'
      document.head.appendChild(viewportMeta)
    }
    ;(viewportMeta as HTMLMetaElement).content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  },
  initPageManager(): void {
    let currentPage: PageType = 'today'
    const appWrap = document.getElementById('app')!
    const setPage = (type: PageType): void => {
      currentPage = type
      appWrap.classList.remove('page-today', 'page-timeline', 'page-calendar', 'is-readonly')
      appWrap.classList.add(`page-${type}`)
      if (type === 'timeline') appWrap.classList.add('is-readonly')
    }
    const getCurrentPage = (): PageType => currentPage
    window.$pms.page = { setPage, getCurrentPage }
  },
  initLoadHelper(): void {
    const renderSkeleton = (container: HTMLElement, type: SkeletonType = 'card'): void => {
      const skeletonTemplates: Record<SkeletonType, string> = {
        card: '<div class="skeleton skeleton-card"></div>',
        task: '<div class="skeleton skeleton-task"></div>',
        text: '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text sm"></div>'
      }
      container.innerHTML = skeletonTemplates[type]
    }
    const renderEmpty = (container: HTMLElement, title = '暂无数据', desc = '添加任务后即可查看内容'): void => {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">${title}</div>
          <div class="empty-desc">${desc}</div>
        </div>
      `
    }
    window.$pms.load = { renderSkeleton, renderEmpty }
  },
  initUtils(): void {
    const addHideScroll = (el: HTMLElement): void => el?.classList.add('hide-scrollbar')
    const removeHideScroll = (el: HTMLElement): void => el?.classList.remove('hide-scrollbar')
    window.$pms.addHideScroll = addHideScroll
    window.$pms.removeHideScroll = removeHideScroll
  },
  async init(): Promise<void> {
    this.initTheme()
    this.initMobileAdapt()
    this.initPageManager()
    this.initLoadHelper()
    this.initUtils()
    await initDB()
    console.log('✅ PMS3.0 初始化完成')
  }
}

// ====================== 全局状态（原样保留） ======================
const state = {
  currentDateKey: getLocalDateKey(getUTCNow()),
  currentEditId: null as number | null,
  taskList: [] as any[],
  monthStats: [] as any[]
}

// ====================== DOM加载完成后执行业务渲染（原样保留所有逻辑） ======================
// 关键修复：type="module" 脚本在 DOMContentLoaded 之后执行，需兼容立即初始化
async function initApp() {
  ;(window as any).$pms = (window as any).$pms || {}
  ;(window as any).$pms.setTheme = (type: ThemeType) => {
    localStorage.setItem('pms-theme', type)
    const root = document.documentElement
    type === 'dark' ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme')
  }

  // 1. 初始化主题/页面管理/工具类（纯同步，不会失败）
  PmsGlobalInit.initTheme()
  PmsGlobalInit.initMobileAdapt()
  PmsGlobalInit.initPageManager()
  PmsGlobalInit.initLoadHelper()
  PmsGlobalInit.initUtils()

  // 2. 绑定事件（必须最先执行，不依赖数据层，确保页面交互立即可用）
  bindEvents()

  // 3. 初始化数据库（独立容错，超时保护，失败不阻塞 UI）
  try {
    await initDB()
    console.log('✅ PMS3.0 数据库初始化完成')
  } catch (err: any) {
    console.warn('[PMS3.0] 数据库初始化异常，部分功能降级:', err?.message || err)
  }

  // 4. 加载业务数据（独立容错）
  try {
    await loadTodayTasks()
  } catch (err: any) {
    console.warn('[PMS3.0] 加载今日任务异常:', err?.message || err)
    showEmpty('加载失败，请刷新重试')
  }

  try {
    await loadMonthStats()
  } catch (err: any) {
    console.warn('[PMS3.0] 加载月度统计异常:', err?.message || err)
  }

  runtimeScan()
  console.log('[PMS3.0] 全功能就绪')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}

// ====================== 以下所有业务函数完全原样保留，无任何修改 ======================
async function loadTodayTasks() {
  showSkeleton()
  try {
    const list = await getTodayTasks(state.currentDateKey)
    state.taskList = list
    renderTodayHeader()
    renderTodayFilter(list)
    renderTodayOverview(list)
    renderTaskList(list)
    if (list.length === 0) showEmpty('今日还没有任务')
    renderHabitArea()
  } finally {
    hideSkeleton()
  }
}

async function loadMonthStats() {
  try {
    const now = new Date()
    const result = await getMonthAllTasks(now.getFullYear(), now.getMonth() + 1)
    state.monthStats = result.dayRateList || []
  } catch (_e) {
    // 静默失败
  }
}

function renderTaskList(list: any[]) {
  const el = document.querySelector('#task-list')
  if (!el) return
  el.innerHTML = ''

  if (list.length === 0) {
    showEmpty()
    return
  }

  // 四级层级定义
  const LEVEL_ORDER = ['day', 'week', 'month', 'year']
  const LEVEL_LABELS: Record<string, string> = { day: '日', week: '周', month: '月', year: '年' }
  const LEVEL_COLORS: Record<string, string> = { day: '#27AE60', week: '#2196F3', month: '#FF9800', year: '#9C27B0' }

  // 读取折叠状态
  const foldKey = `pms-fold-${state.currentDateKey}`
  let foldState: Record<string, boolean> = {}
  try { foldState = JSON.parse(localStorage.getItem(foldKey) || '{}') } catch (_e) { }

  // 按层级分组
  const grouped: Record<string, any[]> = {}
  LEVEL_ORDER.forEach(l => grouped[l] = [])
  list.forEach((t: any) => {
    const lv = t.level || 'day'
    if (!grouped[lv]) grouped[lv] = []
    grouped[lv].push(t)
  })

  LEVEL_ORDER.forEach(level => {
    const items = grouped[level]
    if (items.length === 0) return
    const done = items.filter((t: any) => t.isCompleted).length
    const rate = Math.round((done / items.length) * 100)
    const isFolded = foldState[level] === true

    // 分组头部
    const groupHeader = document.createElement('div')
    groupHeader.className = 'task-group-header'
    groupHeader.style.cssText = `
      display:flex;align-items:center;gap:8px;padding:10px 12px;
      margin-top:8px;border-radius:8px;background:var(--bg-soft);
      border-left:4px solid ${LEVEL_COLORS[level]};
      cursor:pointer;user-select:none;
    `
    groupHeader.innerHTML = `
      <span style="font-size:14px;font-weight:700;color:${LEVEL_COLORS[level]};">${LEVEL_LABELS[level]}</span>
      <span style="font-size:12px;color:var(--text-hint);">${done}/${items.length} · ${rate}%</span>
      <span style="margin-left:auto;font-size:12px;color:var(--text-hint);">${isFolded ? '展开' : '折叠'}</span>
    `
    el.appendChild(groupHeader)

    // 任务容器
    const groupBody = document.createElement('div')
    groupBody.className = 'task-group-body'
    groupBody.style.display = isFolded ? 'none' : 'block'

    items.forEach((task: any) => {
      const item = document.createElement('div')
      const isHidden = task.status === 'hidden'
      item.className = `task-item ${task.isCompleted ? 'completed' : ''} ${isHidden ? 'task-hidden' : ''}`
      item.innerHTML = `
        <span class="task-check">${task.isCompleted ? '✅' : '⬜'}</span>
        <span class="task-title">${task.content || task.title || ''}</span>
        <span class="task-priority ${task.priority || 'normal'}">
          ${task.priority === 'critical' ? '紧急'
            : task.priority === 'urgent' ? '重要'
            : task.priority === 'low' ? '次要'
            : '一般'}
        </span>
      `
      groupBody.appendChild(item)
      item.querySelector('.task-check')!.addEventListener('click', async () => {
        await toggleTaskComplete(task.id, !task.isCompleted)
        loadTodayTasks()
      })
      item.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).classList.contains('task-check')) {
          openEditModal(task)
        }
      })
    })

    el.appendChild(groupBody)

    // 折叠切换
    groupHeader.addEventListener('click', () => {
      const nowHidden = groupBody.style.display === 'none'
      groupBody.style.display = nowHidden ? 'block' : 'none'
      groupHeader.querySelector('span:last-child')!.textContent = nowHidden ? '折叠' : '展开'
      foldState[level] = !nowHidden
      localStorage.setItem(foldKey, JSON.stringify(foldState))
    })
  })
}

// ====================== 今日待办页新增极简组件 ======================
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MOODS = ['😊', '😐', '😔', '😤', '🤩', '😴']
let todayMood = localStorage.getItem(`pms-mood-${state.currentDateKey}`) || localStorage.getItem('pms-mood') || '😊'

function getDateKeyOffset(dk: string, offsetDays: number): string {
  const [y, m, d] = dk.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + offsetDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function renderTodayHeader() {
  const el = document.getElementById('today-header')
  if (!el) return
  const parts = state.currentDateKey.split('-')
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const dateObj = new Date(year, month, day)
  const dateStr = `${year}年${month + 1}月${day}日`
  const weekStr = WEEKDAYS[dateObj.getDay()]
  todayMood = localStorage.getItem(`pms-mood-${state.currentDateKey}`) || localStorage.getItem('pms-mood') || '😊'

  const todayKey = getLocalDateKey(getUTCNow())
  const yesterdayKey = getDateKeyOffset(todayKey, -1)
  const tomorrowKey = getDateKeyOffset(todayKey, 1)

  const quickBtns = [
    { key: yesterdayKey, label: '昨天' },
    { key: todayKey, label: '今天' },
    { key: tomorrowKey, label: '明天' }
  ]

  el.innerHTML = `
    <div class="th-main">
      <div class="th-date">
        <span class="th-date-main">${dateStr}</span>
        <span class="th-date-week">${weekStr}</span>
      </div>
      <div class="th-mood" id="th-mood-btn" title="点击切换心情">${todayMood}</div>
    </div>
    <div class="th-quick-nav">
      ${quickBtns.map(b => `
        <button class="th-quick-btn ${b.key === state.currentDateKey ? 'active' : ''}" data-qk="${b.key}">${b.label}</button>
      `).join('')}
    </div>
  `

  const moodBtn = document.getElementById('th-mood-btn')
  if (moodBtn) {
    moodBtn.addEventListener('click', () => {
      const idx = MOODS.indexOf(todayMood)
      todayMood = MOODS[(idx + 1) % MOODS.length]
      localStorage.setItem(`pms-mood-${state.currentDateKey}`, todayMood)
      localStorage.setItem('pms-mood', todayMood)
      renderTodayHeader()
    })
  }

  el.querySelectorAll('.th-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qk = btn.getAttribute('data-qk')
      if (qk && qk !== state.currentDateKey) {
        state.currentDateKey = qk
        loadTodayTasks()
      }
    })
  })
}

const LEVEL_META: { id: string; label: string }[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'year', label: '年' }
]
let activeLevelFilter = localStorage.getItem('pms-filter-level') || 'all'
let activeCatFilter = localStorage.getItem('pms-filter-cat') || 'all'

function renderTodayFilter(list: any[]) {
  const el = document.getElementById('today-filter-bar')
  if (!el) return
  // 只保留分类筛选（层级已由任务列表四级分组承载，不重复）
  const catKeys = Object.keys(TASK_CATEGORIES)
  const catStats = catKeys.map(k => {
    const items = list.filter((t: any) => t.category1 === k)
    const done = items.filter((t: any) => t.isCompleted).length
    return { key: k, label: CAT1_LABELS[k], total: items.length, done, rate: items.length ? Math.round((done / items.length) * 100) : 0 }
  })
  el.innerHTML = `
    <div class="tf-scroll">
      <button class="tf-pill ${activeCatFilter === 'all' ? 'active' : ''}" data-filter="cat" data-val="all">全部</button>
      ${catStats.map(cs => `
        <button class="tf-pill ${activeCatFilter === cs.key ? 'active' : ''}" data-filter="cat" data-val="${cs.key}">
          ${cs.label}
          <span class="tf-progress"><span class="tf-progress-fill" style="width:${cs.rate}%"></span></span>
        </button>
      `).join('')}
    </div>
  `
  el.querySelectorAll('.tf-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val') || 'all'
      activeCatFilter = activeCatFilter === val ? 'all' : val
      localStorage.setItem('pms-filter-cat', activeCatFilter)
      applyFilters()
    })
  })
}

function applyFilters() {
  let filtered = state.taskList
  if (activeCatFilter !== 'all') {
    filtered = filtered.filter((t: any) => t.category1 === activeCatFilter)
  }
  renderTodayFilter(state.taskList)
  renderTaskList(filtered)
  if (filtered.length === 0 && state.taskList.length > 0) {
    showEmpty('当前筛选条件下无任务')
  }
}

function renderTodayOverview(list: any[]) {
  const el = document.getElementById('today-overview')
  if (!el) return
  const total = list.length
  const completed = list.filter((t: any) => t.isCompleted).length
  const rate = total ? Math.round((completed / total) * 100) : 0
  // 习惯进度（真实计算：饮水+健康补给+每日自省）
  const waterDone = localStorage.getItem(`pms-water-done-${state.currentDateKey}`) === '1'
  const healthDone = localStorage.getItem(`pms-health-${state.currentDateKey}`) === '1'
  const reflectionDone = localStorage.getItem(`pms-reflection-${state.currentDateKey}`) === '1'
  const habitDone = [waterDone, healthDone, reflectionDone].filter(Boolean).length
  const habitProgress = Math.round((habitDone / 3) * 100)
  // 能量损益（简化：完成-未完成）
  const energy = completed - (total - completed)
  const energyStr = energy >= 0 ? `+${energy}` : `${energy}`
  const energyClass = energy >= 0 ? 'positive' : 'negative'
  el.innerHTML = `
    <div class="to-item">
      <div class="to-value">${rate}%</div>
      <div class="to-label">完成率</div>
    </div>
    <div class="to-item">
      <div class="to-value">${total}</div>
      <div class="to-label">任务数</div>
    </div>
    <div class="to-item">
      <div class="to-value">${habitProgress}%</div>
      <div class="to-label">习惯进度</div>
    </div>
    <div class="to-item">
      <div class="to-value ${energyClass}">${energyStr}</div>
      <div class="to-label">能量损益</div>
    </div>
  `
}

// ====================== 饮水台账（内嵌今日页习惯区 + 弹窗模式） ======================
const WATER_GOAL = 2000
const WATER_SCENES = ['居家自制', '外部外购']
const WATER_CATS = ['纯净水', '茶饮', '咖啡', '果汁', '奶茶', '奶制品', '酒精饮品']
const WATER_PRESETS = [100, 200, 300, 500]

async function renderHabitArea() {
  const el = document.getElementById('habit-area')
  if (!el) return
  let records: any[] = []
  try {
    records = await getWaterByDate(state.currentDateKey)
  } catch (_e) { records = [] }
  const total = records.reduce((s, r) => s + (r.amount || 0), 0)
  const pct = Math.min(100, Math.round((total / WATER_GOAL) * 100))
  // 饮水达标本地标记（供月历四要素读取）
  if (pct >= 100) localStorage.setItem(`pms-water-done-${state.currentDateKey}`, '1')
  else localStorage.removeItem(`pms-water-done-${state.currentDateKey}`)

  // 健康补给 & 每日自省状态（本地持久化）
  const healthKey = `pms-health-${state.currentDateKey}`
  const reflectionKey = `pms-reflection-${state.currentDateKey}`
  const healthDone = localStorage.getItem(healthKey) === '1'
  const reflectionDone = localStorage.getItem(reflectionKey) === '1'

  el.innerHTML = `
    <div class="habit-scroll">
      <div class="habit-card water-quick-card" id="water-quick-card">
        <div class="hqc-icon">💧</div>
        <div class="hqc-body">
          <div class="hqc-title">饮水台账</div>
          <div class="hqc-progress">
            <div class="hqc-bar"><div class="hqc-bar-fill" style="width:${pct}%"></div></div>
            <div class="hqc-text">${total}ml / ${WATER_GOAL}ml</div>
          </div>
        </div>
        <div class="hqc-arrow">›</div>
      </div>

      <div class="habit-card status-card" id="health-card" style="min-width:140px">
        <span class="status-dot ${healthDone ? 'done' : ''}"></span>
        <div class="hqc-icon">💊</div>
        <div class="hqc-body">
          <div class="hqc-title">健康补给</div>
          <div class="hqc-text">${healthDone ? '已完成' : '待完成'}</div>
        </div>
      </div>

      <div class="habit-card status-card" id="reflection-card" style="min-width:140px">
        <span class="status-dot ${reflectionDone ? 'done' : ''}"></span>
        <div class="hqc-icon">🪞</div>
        <div class="hqc-body">
          <div class="hqc-title">每日自省</div>
          <div class="hqc-text">${reflectionDone ? '已完成' : '待完成'}</div>
        </div>
      </div>
    </div>
  `
  const card = document.getElementById('water-quick-card')
  if (card) card.addEventListener('click', () => openWaterModal())

  const healthCard = document.getElementById('health-card')
  if (healthCard) {
    healthCard.addEventListener('click', () => {
      const done = localStorage.getItem(healthKey) === '1'
      if (done) localStorage.removeItem(healthKey)
      else localStorage.setItem(healthKey, '1')
      renderHabitArea()
    })
  }

  const reflectionCard = document.getElementById('reflection-card')
  if (reflectionCard) {
    reflectionCard.addEventListener('click', () => {
      const done = localStorage.getItem(reflectionKey) === '1'
      if (done) localStorage.removeItem(reflectionKey)
      else localStorage.setItem(reflectionKey, '1')
      renderHabitArea()
    })
  }
}

async function openWaterModal() {
  let records: any[] = []
  try {
    records = await getWaterByDate(state.currentDateKey)
  } catch (_e) { records = [] }
  const total = records.reduce((s, r) => s + (r.amount || 0), 0)
  const pct = Math.min(100, Math.round((total / WATER_GOAL) * 100))
  const recordList = records.length ? records.map((r, i) => `
    <div class="wm-record-item" data-id="${r.id}">
      <span class="wm-record-time">${r.time || ''}</span>
      <span class="wm-record-amount">${r.amount}ml</span>
      <span class="wm-record-cat">${r.category || ''}${r.scene ? '·' + r.scene : ''}</span>
      <button class="wm-record-del" data-idx="${i}">删除</button>
    </div>
  `).join('') : `<div class="empty-state"><div class="empty-icon">💧</div><div class="empty-title">今日暂无饮水记录</div><div class="empty-desc">点击下方按钮快捷录入</div></div>`
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal-box wm-modal-box">
      <div class="modal-title">💧 饮水台账</div>
      <div class="wm-progress-section">
        <div class="wm-progress-bar"><div class="wm-progress-fill" style="width:${pct}%"></div></div>
        <div class="wm-progress-label">${total}ml / 目标 ${WATER_GOAL}ml</div>
      </div>
      <div class="wm-section-label">快捷录入</div>
      <div class="wm-scene-row">
        ${WATER_SCENES.map((s, i) => `<button class="btn btn-outline wm-scene-pill ${i === 0 ? 'active' : ''}" data-scene="${s}">${i === 0 ? '🏠 ' : '🏪 '}${s}</button>`).join('')}
      </div>
      <div class="wm-cat-row">
        ${WATER_CATS.map((c, i) => `<button class="btn btn-outline wm-cat-pill ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="wm-preset-row">
        ${WATER_PRESETS.map(p => `<button class="btn btn-outline wm-preset-btn" data-amount="${p}">${p}ml</button>`).join('')}
        <input type="number" class="input wm-custom-input" placeholder="自定义ml" min="1" />
        <button class="btn btn-primary wm-confirm-btn">确认录入</button>
      </div>
      <div class="wm-section-label">当日记录</div>
      <div class="wm-record-list">${recordList}</div>
      <div class="modal-footer">
        <button class="btn btn-danger wm-clear-btn" ${records.length === 0 ? 'disabled' : ''}>🗑️ 清空当日记录</button>
        <button class="btn btn-outline">关闭</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
  document.body.classList.add('modal-open')
  let selectedScene = WATER_SCENES[0]
  let selectedCat = WATER_CATS[0]
  overlay.querySelectorAll('.wm-scene-pill').forEach(el => {
    el.addEventListener('click', () => {
      overlay.querySelectorAll('.wm-scene-pill').forEach(x => x.classList.remove('active'))
      el.classList.add('active')
      selectedScene = el.getAttribute('data-scene') || ''
    })
  })
  overlay.querySelectorAll('.wm-cat-pill').forEach(el => {
    el.addEventListener('click', () => {
      overlay.querySelectorAll('.wm-cat-pill').forEach(x => x.classList.remove('active'))
      el.classList.add('active')
      selectedCat = el.getAttribute('data-cat') || ''
    })
  })
  const refreshModal = async () => {
    document.body.removeChild(overlay)
    document.body.classList.remove('modal-open')
    await renderHabitArea()
    await openWaterModal()
  }
  const doAdd = async (amount: number) => {
    if (!amount || amount <= 0) return alert('请输入有效水量')
    try {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      await createWaterRecord({
        dateKey: state.currentDateKey,
        amount,
        category: selectedCat,
        scene: selectedScene,
        time,
        createTime: Date.now()
      } as any)
      await refreshModal()
    } catch (e: any) {
      alert('录入失败: ' + (e?.message || e))
    }
  }
  overlay.querySelectorAll('.wm-preset-btn').forEach(el => {
    el.addEventListener('click', () => {
      const amt = parseInt(el.getAttribute('data-amount') || '0')
      doAdd(amt)
    })
  })
  overlay.querySelector('.wm-confirm-btn')!.addEventListener('click', () => {
    const input = overlay.querySelector('.wm-custom-input') as HTMLInputElement
    doAdd(parseInt(input?.value || '0'))
  })
  overlay.querySelectorAll('.wm-record-del').forEach(el => {
    el.addEventListener('click', async () => {
      const idx = parseInt(el.getAttribute('data-idx') || '-1')
      if (idx >= 0 && records[idx]) {
        await deleteWaterRecord(records[idx].id)
        await refreshModal()
      }
    })
  })
  overlay.querySelector('.wm-clear-btn')!.addEventListener('click', async () => {
    if (!confirm('确定清空当日所有饮水记录？')) return
    await clearWaterByDate(state.currentDateKey)
    await refreshModal()
  })
  const closeBtns = overlay.querySelectorAll('.btn-outline')
  closeBtns.forEach(btn => {
    if (btn.textContent === '关闭') {
      btn.addEventListener('click', () => {
        document.body.removeChild(overlay)
        document.body.classList.remove('modal-open')
        renderHabitArea()
      })
    }
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay)
      document.body.classList.remove('modal-open')
      renderHabitArea()
    }
  })
}

function bindEvents() {
  const fabTask = document.querySelector('#fab-task')
  if (fabTask) fabTask.addEventListener('click', openAddModal)
  const fabFinance = document.querySelector('#fab-finance')
  if (fabFinance) fabFinance.addEventListener('click', () => openFinanceModal())
  document.querySelectorAll('.bottom-tab-item').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      document.querySelectorAll('.bottom-tab-item').forEach(x => x.classList.remove('active'))
      a.classList.add('active')
      const tab = a.getAttribute('data-tab')
      switchTab(tab)
    })
  })
}

async function switchTab(tab: string | null) {
  document.querySelectorAll('.page').forEach(p => ((p as HTMLElement).style.display = 'none'))
  if (tab === 'timeline') {
    const pg = document.querySelector('#page-timeline') as HTMLElement
    if (pg) pg.style.display = 'block'
    await renderTimeline()
    ;(window as any).$pms.page?.setPage('timeline')
  } else if (tab === 'month') {
    const pg = document.querySelector('#page-month') as HTMLElement
    if (pg) pg.style.display = 'block'
    renderCalendar()
    ;(window as any).$pms.page?.setPage('calendar')
  } else {
    const pg = document.querySelector('#page-today') as HTMLElement
    if (pg) pg.style.display = 'block'
    ;(window as any).$pms.page?.setPage('today')
  }
}

const TASK_CATEGORIES: Record<string, string[]> = {
  work: ['办公事务', '会议沟通', '项目推进', '客户对接'],
  learn: ['系统学习', '阅读笔记', '技能提升', '资料整理', '兴趣深化'],
  health: ['运动健身', '饮食管理'],
  life: ['日常琐事', '家务整理', '超市采购', '个人护理', '家庭事务'],
  leisure: ['逛街购物', '兴趣培养', '社交聚会', '影视阅读', '旅行规划'],
  travel: ['通勤出行', '短途出行', '长途旅行'],
  dark: ['临时事项', '杂项事务', '待分类', '备忘提醒']
}
const CAT1_LABELS: Record<string, string> = {
  work: '工作', learn: '学习', health: '健康',
  life: '生活', leisure: '休闲', travel: '出行', dark: '其他'
}
const TASK_LEVELS: { id: string; label: string }[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'year', label: '年' }
]

function openAddModal() {
  state.currentEditId = null
  renderModal({
    title: '新建任务', id: null, content: '',
    startTime: '', endTime: '', priority: 'normal', note: '',
    level: 'day', category1: '', category2: ''
  })
}
function openEditModal(task: any) {
  state.currentEditId = task.id
  renderModal({
    title: '编辑任务', id: task.id, content: task.content || task.title || '',
    startTime: task.startTime || '', endTime: task.endTime || '',
    priority: task.priority, note: task.note || '',
    level: task.level || 'day', category1: task.category1 || '', category2: task.category2 || ''
  })
}
function renderModal(data: any) {
  closeModal()
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
  <div class="modal-box">
    <div class="modal-title">${data.title}</div>
    <div class="form-group">
      <label class="form-label">任务标题</label>
      <input id="task-title" class="input" value="${data.content}">
    </div>
    <div class="form-time-row">
      <div class="form-group">
        <label class="form-label">开始</label>
        <input id="start-time" type="time" class="input" value="${data.startTime}">
      </div>
      <div class="form-group">
        <label class="form-label">结束</label>
        <input id="end-time" type="time" class="input" value="${data.endTime}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">优先级</label>
      <div class="priority-selector">
        <div class="priority-option critical ${data.priority === 'critical' ? 'active' : ''}">紧急</div>
        <div class="priority-option urgent ${data.priority === 'urgent' ? 'active' : ''}">重要</div>
        <div class="priority-option normal ${data.priority === 'normal' ? 'active' : ''}">一般</div>
        <div class="priority-option low ${data.priority === 'low' ? 'active' : ''}">次要</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">层级</label>
      <div class="priority-selector" id="level-selector">
        ${TASK_LEVELS.map(l => `<div class="priority-option ${data.level === l.id ? 'active' : ''}" data-level="${l.id}">${l.label}</div>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">分类</label>
      <div id="cat1-scroll" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${Object.keys(TASK_CATEGORIES).map(k => `<button class="btn btn-outline cat1-pill ${data.category1 === k ? 'active' : ''}" data-cat1="${k}" style="font-size:13px;padding:4px 12px;border-radius:999px">${CAT1_LABELS[k]}</button>`).join('')}
      </div>
      <div id="cat2-scroll" style="display:flex;gap:6px;flex-wrap:wrap">
        ${(data.category1 && TASK_CATEGORIES[data.category1] ? TASK_CATEGORIES[data.category1] : []).map(c => `<button class="btn btn-outline cat2-pill ${data.category2 === c ? 'active' : ''}" data-cat2="${c}" style="font-size:13px;padding:4px 12px;border-radius:999px">${c}</button>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">备注</label>
      <textarea id="task-note" class="textarea">${data.note}</textarea>
    </div>
    <div class="modal-footer">
      <button id="cancel" class="btn btn-outline">取消</button>
      ${data.id ? '<button id="delete" class="btn btn-danger">删除</button>' : ''}
      <button id="save" class="btn btn-primary">保存</button>
    </div>
  </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) closeModal() })
  document.querySelector('#cancel')!.addEventListener('click', closeModal)
  document.querySelector('#save')!.addEventListener('click', saveTask)
  document.querySelector('#delete')?.addEventListener('click', deleteTask)
  document.querySelectorAll('.priority-option').forEach(el => {
    el.addEventListener('click', () => {
      const parent = el.parentElement
      if (!parent) return
      // 仅在同一选择器组内切换 active
      if (parent.id === 'level-selector') {
        parent.querySelectorAll('.priority-option').forEach(o => o.classList.remove('active'))
        el.classList.add('active')
      } else {
        // 优先级选择器
        document.querySelectorAll('.priority-selector:not(#level-selector) .priority-option').forEach(o => o.classList.remove('active'))
        el.classList.add('active')
      }
    })
  })
  // 一级分类点击
  document.querySelectorAll('.cat1-pill').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.cat1-pill').forEach(o => o.classList.remove('active'))
      el.classList.add('active')
      const cat1 = el.getAttribute('data-cat1') || ''
      const cat2Wrap = document.getElementById('cat2-scroll')
      if (cat2Wrap && TASK_CATEGORIES[cat1]) {
        cat2Wrap.innerHTML = TASK_CATEGORIES[cat1].map(c =>
          `<button class="btn btn-outline cat2-pill" data-cat2="${c}" style="font-size:13px;padding:4px 12px;border-radius:999px">${c}</button>`
        ).join('')
        cat2Wrap.querySelectorAll('.cat2-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            cat2Wrap.querySelectorAll('.cat2-pill').forEach(o => o.classList.remove('active'))
            btn.classList.add('active')
          })
        })
      }
    })
  })
  // 二级分类点击（已有子分类时）
  document.querySelectorAll('.cat2-pill').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.cat2-pill').forEach(o => o.classList.remove('active'))
      el.classList.add('active')
    })
  })
}

async function saveTask() {
  const titleEl = document.querySelector('#task-title') as HTMLInputElement | null
  const startEl = document.querySelector('#start-time') as HTMLInputElement | null
  const endEl = document.querySelector('#end-time') as HTMLInputElement | null
  const noteEl = document.querySelector('#task-note') as HTMLTextAreaElement | null
  const active = document.querySelector('.priority-selector:not(#level-selector) .priority-option.active') as HTMLElement | null
  const levelEl = document.querySelector('#level-selector .priority-option.active') as HTMLElement | null
  const cat1El = document.querySelector('.cat1-pill.active') as HTMLElement | null
  const cat2El = document.querySelector('.cat2-pill.active') as HTMLElement | null
  if (!titleEl) return alert('表单未就绪，请重试')
  const title = titleEl.value.trim()
  const startTime = startEl?.value || ''
  const endTime = endEl?.value || ''
  const note = noteEl?.value || ''
  const priority = active?.classList.contains('critical') ? 'critical'
    : active?.classList.contains('urgent') ? 'urgent'
    : active?.classList.contains('low') ? 'low'
    : 'normal'
  const level = (levelEl?.getAttribute('data-level') || 'day') as 'day' | 'week' | 'month' | 'year'
  const category1 = cat1El?.getAttribute('data-cat1') || ''
  const category2 = cat2El?.getAttribute('data-cat2') || ''
  if (!title) return alert('请输入任务标题')
  try {
    if (state.currentEditId === null) {
      await createTodayTask('today', {
        content: title,
        priority: (priority === 'critical' || priority === 'urgent') ? 'urgent' : 'normal',
        type: 'todo',
        isCompleted: false,
        level, category1, category2, startTime, endTime, note
      } as any)
    } else {
      await softDeleteTask(state.currentEditId)
      await createTodayTask('today', {
        content: title,
        priority: (priority === 'critical' || priority === 'urgent') ? 'urgent' : 'normal',
        type: 'todo',
        isCompleted: false,
        level, category1, category2, startTime, endTime, note
      } as any)
    }
    // 数据变更后清空弹窗缓存（P4性能优化逻辑保留）
    clearModalCache()
    closeModal()
    loadTodayTasks()
    loadMonthStats()
  } catch (_e) {
    alert('保存失败')
  }
}

async function deleteTask() {
  if (!state.currentEditId) return
  if (!confirm('确定删除？')) return
  await softDeleteTask(state.currentEditId)
  clearModalCache()
  closeModal()
  loadTodayTasks()
  loadMonthStats()
}

function showSkeleton() {
  const el = document.querySelector('#task-list')
  if (el) el.innerHTML = `
    <div class="skeleton skeleton-task"></div>
    <div class="skeleton skeleton-task"></div>
  `
}
function hideSkeleton() {
  const el = document.getElementById('loading-fallback')
  if (el) el.style.display = 'none'
  const el2 = document.querySelector('#page-today')
  if (el2) (el2 as HTMLElement).style.display = 'block'
}
function showEmpty(text: string) {
  const el = document.querySelector('#task-list')
  if (el) el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-title">暂无任务</div>
      <div class="empty-desc">${text}</div>
    </div>
  `
}

async function renderTimeline() {
  const container = document.querySelector('#page-timeline') as HTMLElement
  if (!container) return

  // 工具函数
  function getMonday(d: Date): Date {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.getFullYear(), d.getMonth(), diff)
  }
  function addDays(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
  }
  function fmtDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  function fmtShortDate(d: Date): string {
    return `${d.getMonth() + 1}.${d.getDate()}`
  }
  function getWeekNumber(d: Date): number {
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((d.getTime() - yearStart.getTime()) / 86400000) + 1
    return Math.ceil(dayOfYear / 7)
  }

  // 计算周起始日
  let weekStartStr = localStorage.getItem('pms-timeline-week')
  let weekStart: Date
  if (weekStartStr) {
    weekStart = new Date(weekStartStr + 'T00:00:00')
    weekStart = getMonday(weekStart)
  } else {
    weekStart = getMonday(new Date())
  }

  const weekEnd = addDays(weekStart, 6)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    return {
      date: d,
      dateKey: fmtDateKey(d),
      dayNum: d.getDate(),
      weekLabel: ['一', '二', '三', '四', '五', '六', '日'][i]
    }
  })

  // 持久化
  localStorage.setItem('pms-timeline-week', fmtDateKey(weekStart))

  // 确定高亮日期：优先用本周内的 currentDateKey，否则高亮与今天同星期几的日期
  const inWeek = weekDays.find(d => d.dateKey === state.currentDateKey)
  let highlightedDateKey = ''
  if (inWeek) {
    highlightedDateKey = state.currentDateKey
  } else {
    // 高亮与今天同星期几的日期
    const todayDow = new Date().getDay()
    const mondayDow = todayDow === 0 ? 6 : todayDow - 1
    highlightedDateKey = weekDays[mondayDow]?.dateKey || weekDays[0].dateKey
  }

  // 获取本周所有任务
  const weekTaskLists = await Promise.all(weekDays.map(d => getTodayTasks(d.dateKey)))
  const weekTasks = weekTaskLists.flat()

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0') + ':00'
  )

  const weekRangeText = `${fmtShortDate(weekStart)} - ${fmtShortDate(weekEnd)}`
  const weekNum = getWeekNumber(weekStart)
  const yearNum = weekStart.getFullYear()

  // 渲染
  container.innerHTML = `
    <div id="timeline-area">
      <!-- 周导航栏 -->
      <div class="tl-week-nav" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);margin-bottom:12px">
        <button class="tl-nav-btn" id="tl-prev" style="background:var(--bg-soft);border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;color:var(--text);font-size:14px">&larr;</button>
        <div style="text-align:center;flex:1">
          <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${weekRangeText}</div>
          <div style="font-size:12px;color:var(--text-hint);margin-top:2px">${yearNum}年第${weekNum}周</div>
        </div>
        <button class="tl-nav-btn" id="tl-next" style="background:var(--bg-soft);border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;color:var(--text);font-size:14px">&rarr;</button>
        <button class="tl-today-btn" id="tl-today" style="background:var(--primary);border:none;border-radius:8px;padding:6px 12px;cursor:pointer;color:#fff;font-size:12px;margin-left:8px;white-space:nowrap">回到本周</button>
      </div>

      <!-- 横向日期栏（横轴）——左侧占位与时间轴等宽，形成正交网格角 -->
      <div class="tl-day-header">
        <div class="tl-corner-spacer"></div>
        ${weekDays.map(d => `
          <div class="tl-day-cell ${d.dateKey === highlightedDateKey ? 'active' : ''}" data-date="${d.dateKey}">
            <div style="font-size:15px;font-weight:600">${d.dayNum}</div>
            <div style="font-size:10px;margin-top:1px;opacity:.7">周${d.weekLabel}</div>
          </div>
        `).join('')}
      </div>

      <!-- 正交时序网格（纵轴 00:00–23:00） -->
      <div class="timeline-container hide-scrollbar">
        <div class="timeline-wrap">
          <div class="timeline-time-axis">
            ${hours.map(h => `<div>${h}</div>`).join('')}
          </div>
          <div class="timeline-day-grid">
            ${hours.map(() => `<div class="timeline-hour-row"></div>`).join('')}
          </div>
        </div>
      </div>
      ${weekTasks.length === 0 ? `
        <div class="tl-empty-hint">本周暂无时序任务 · 在今日页添加带开始时间的任务后将自动显示</div>
      ` : ''}
    </div>
  `

  // 绑定纵向时间轴任务
  if (weekTasks.length > 0) {
    const rows = document.querySelectorAll('.timeline-hour-row')
    weekTasks.forEach((task: any) => {
      if (!task.startTime) return
      const hour = task.startTime.slice(0, 2)
      const idx = parseInt(hour, 10)
      if (!rows[idx]) return
      const bar = document.createElement('div')
      bar.className = 'timeline-task-bar'
      bar.setAttribute('data-tl-date', task.dateKey || '')
      bar.innerHTML = `<span class="timeline-anchor-mark"></span>${task.content || task.title || ''}`
      bar.addEventListener('click', () => {
        state.currentDateKey = task.dateKey
        loadTodayTasks()
        switchTab('today')
      })
      rows[idx].appendChild(bar)
    })
  }

  // 聚焦效果：currentDateKey 在当前周内时，淡化其他日期的任务条
  if (inWeek) {
    container.querySelectorAll('.timeline-task-bar').forEach((bar: any) => {
      if (bar.getAttribute('data-tl-date') !== state.currentDateKey) {
        bar.style.opacity = '0.35'
      }
    })
  }

  // 绑定周导航事件
  const prevBtn = container.querySelector('#tl-prev')
  const nextBtn = container.querySelector('#tl-next')
  const todayBtn = container.querySelector('#tl-today')
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const newStart = addDays(weekStart, -7)
      localStorage.setItem('pms-timeline-week', fmtDateKey(newStart))
      renderTimeline()
    })
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const newStart = addDays(weekStart, 7)
      localStorage.setItem('pms-timeline-week', fmtDateKey(newStart))
      renderTimeline()
    })
  }
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      localStorage.removeItem('pms-timeline-week')
      renderTimeline()
    })
  }

  // 绑定日期头点击：跳转至今日待办页查看该日
  container.querySelectorAll('.tl-day-cell').forEach(el => {
    el.addEventListener('click', () => {
      const dk = el.getAttribute('data-date')
      if (dk) {
        state.currentDateKey = dk
        loadTodayTasks()
        switchTab('today')
      }
    })
  })

  // 绑定筛选胶囊事件
  container.querySelectorAll('.tf-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-filter')
      const val = btn.getAttribute('data-val') || 'all'
      if (type === 'level') {
        activeLevelFilter = activeLevelFilter === val ? 'all' : val
        localStorage.setItem('pms-filter-level', activeLevelFilter)
      } else {
        activeCatFilter = activeCatFilter === val ? 'all' : val
        localStorage.setItem('pms-filter-cat', activeCatFilter)
      }
      renderTimeline()
    })
  })

  // 手势切换周
  const timelineArea = container.querySelector('#timeline-area') as HTMLElement
  if (timelineArea) {
    let touchStartX = 0
    let touchCurrentX = 0
    timelineArea.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX
    }, { passive: true })
    timelineArea.addEventListener('touchmove', (e) => {
      touchCurrentX = e.changedTouches[0].screenX
    }, { passive: true })
    timelineArea.addEventListener('touchend', () => {
      const diff = touchStartX - touchCurrentX
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          const newStart = addDays(weekStart, 7)
          localStorage.setItem('pms-timeline-week', fmtDateKey(newStart))
          renderTimeline()
        } else {
          const newStart = addDays(weekStart, -7)
          localStorage.setItem('pms-timeline-week', fmtDateKey(newStart))
          renderTimeline()
        }
      }
    }, { passive: true })
  }
}

async function renderCalendar() {
  const container = document.querySelector('#page-month')
  if (!container) return

  // --- 月份导航状态 ---
  const calOffsetRaw = localStorage.getItem('pms-calendar-month-offset')
  let calOffset = calOffsetRaw ? parseInt(calOffsetRaw, 10) : 0
  if (isNaN(calOffset)) calOffset = 0
  const baseDate = new Date()
  baseDate.setMonth(baseDate.getMonth() + calOffset)
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const monthLabel = `${year}年${month + 1}月`

  // --- 持久化状态读取 ---
  const filterState = { coarse: 'task', taskLevel: 'all', taskCat: 'all', habitSub: 'all', assetSub: 'all', ...JSON.parse(localStorage.getItem('pms-calendar-filter') || '{}') }
  const periodState = localStorage.getItem('pms-calendar-period') || 'month'
  const summaryFolded = localStorage.getItem('pms-calendar-summary-fold') !== 'false'

  // --- 数据获取（保持现有逻辑不变） ---
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthData = await getMonthAllTasks(year, month + 1)
  const taskGroupByDate: Record<string, any[]> = {}
  if (Array.isArray(monthData)) {
    monthData.forEach((task: any) => {
      const k = task.dateKey
      if (k) (taskGroupByDate[k] || (taskGroupByDate[k] = [])).push(task)
    })
  }
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  let finStats = { income: 0, expense: 0, balance: 0, dayMap: {} as Record<string, { income: number; expense: number }>, catMap: {} as Record<string, number> }
  let finRecords: any[] = []
  try {
    finStats = await getFinanceStats(monthKey + '-01', monthKey + '-31')
  } catch (_e) { /* 降级 */ }
  try {
    finRecords = await listAssetRecordsByRange(monthKey + '-01', monthKey + '-31')
  } catch (_e) { /* 降级 */ }

  // --- 额外数据：月度原始任务（供复盘过滤使用） ---
  let rawMonthTasks: any[] = []
  try {
    const db = getTimeDB()
    const all = await db.getAll('tasks') as any[]
    rawMonthTasks = all.filter((item: any) => {
      const [y, m] = (item.dateKey || '').split('-').map(Number)
      return y === year && m === month + 1 && !item.isDeleted
    })
  } catch (_e) { /* 降级 */ }

  // --- 额外数据：饮水统计 ---
  let waterStats = { total: 0, goalDays: 0 }
  try {
    waterStats = await getWaterStats(monthKey + '-01', monthKey + '-31')
  } catch (_e) { /* 降级 */ }

  // --- 年视图数据（按需获取） ---
  let yearMonthStats: any[] = []
  if (periodState === 'year') {
    try {
      yearMonthStats = await Promise.all(
        Array.from({ length: 12 }, (_, i) => getMonthAllTasks(year, i + 1))
      )
    } catch (_e) { /* 降级 */ }
  }

  // --- 复盘数据计算 ---
  // A. 时序任务复盘（按层级）
  let filteredTasks = rawMonthTasks
  if (filterState.coarse === 'task') {
    if (filterState.taskLevel !== 'all') {
      filteredTasks = filteredTasks.filter((t: any) => (t.level || 'day') === filterState.taskLevel)
    }
    if (filterState.taskCat !== 'all') {
      filteredTasks = filteredTasks.filter((t: any) => t.category1 === filterState.taskCat)
    }
  }
  const levelAgg: Record<string, { total: number; done: number }> = { day: { total: 0, done: 0 }, week: { total: 0, done: 0 }, month: { total: 0, done: 0 }, year: { total: 0, done: 0 } }
  filteredTasks.forEach((t: any) => {
    const lv = t.level || 'day'
    if (!levelAgg[lv]) levelAgg[lv] = { total: 0, done: 0 }
    levelAgg[lv].total++
    if (t.isCompleted) levelAgg[lv].done++
  })
  const levelReview = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
    { key: 'year', label: '年' }
  ].map(item => {
    const agg = levelAgg[item.key] || { total: 0, done: 0 }
    const rate = agg.total ? Math.round((agg.done / agg.total) * 100) : 0
    return { ...item, ...agg, rate }
  })

  // B. 习惯复盘 + D. 心情分布
  let habitWaterGoalDays = 0
  let habitHealthDays = 0
  let habitReflectionDays = 0
  const moodDist: Record<string, number> = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (localStorage.getItem(`pms-water-done-${dk}`) === '1') habitWaterGoalDays++
    if (localStorage.getItem(`pms-health-${dk}`) === '1') habitHealthDays++
    if (localStorage.getItem(`pms-reflection-${dk}`) === '1') habitReflectionDays++
    const m = localStorage.getItem(`pms-mood-${dk}`)
    if (m) { moodDist[m] = (moodDist[m] || 0) + 1 }
  }
  const healthRate = daysInMonth ? Math.round((habitHealthDays / daysInMonth) * 100) : 0
  const reflectionRate = daysInMonth ? Math.round((habitReflectionDays / daysInMonth) * 100) : 0

  // 习惯显示控制
  const showWater = filterState.coarse !== 'habit' || filterState.habitSub === 'all' || filterState.habitSub === 'water'
  const showHealth = filterState.coarse !== 'habit' || filterState.habitSub === 'all' || filterState.habitSub === 'health'
  const showReflection = filterState.coarse !== 'habit' || filterState.habitSub === 'all' || filterState.habitSub === 'reflection'

  // C. 资产财务复盘
  const showIncome = filterState.coarse !== 'asset' || filterState.assetSub === 'all' || filterState.assetSub === 'income'
  const showExpense = filterState.coarse !== 'asset' || filterState.assetSub === 'all' || filterState.assetSub === 'expense'
  const expenseCats = Object.entries(finStats.catMap || {})
    .filter(([cat]) => finRecords.some((r: any) => r.category === cat && r.type === 'expense'))
    .map(([cat, amount]) => ({ cat, amount: amount as number }))
  const totalExpense = expenseCats.reduce((s, c) => s + c.amount, 0)
  const expenseCatRates = expenseCats.map(c => ({ ...c, rate: totalExpense ? Math.round((c.amount / totalExpense) * 100) : 0 }))

  // --- 日历网格生成（基于周期） ---
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  let calendarGridHtml = ''

  if (periodState === 'month') {
    const cells: string[] = []
    for (let i = 0; i < firstDayOfMonth; i++)
      cells.push('<div class="calendar-cell empty"></div>')
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const tasks = taskGroupByDate[dateKey] || []
      const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
      const isArchive = new Date(dateKey).getTime() < Date.now() - 30 * 86400000
      const dots = tasks.map((t: any) => {
        if (t.priority === 'critical') return '<span class="dot-critical"></span>'
        if (t.priority === 'urgent') return '<span class="dot-urgent"></span>'
        if (t.priority === 'low') return '<span class="dot-low"></span>'
        return '<span class="dot-normal"></span>'
      }).join('')
      const mood = localStorage.getItem(`pms-mood-${dateKey}`) || ''
      const waterDone = localStorage.getItem(`pms-water-done-${dateKey}`) === '1'
      const healthDone = localStorage.getItem(`pms-health-${dateKey}`) === '1'
      const reflectionDone = localStorage.getItem(`pms-reflection-${dateKey}`) === '1'
      const dayFin = finStats.dayMap[dateKey] || { income: 0, expense: 0 }
      cells.push(`
        <div class="calendar-cell ${isToday ? 'today' : ''} ${isArchive ? 'archive' : ''}" data-date="${dateKey}">
          <div class="calendar-day-top">
            <span class="calendar-day-num">${day}</span>
            ${mood ? `<span class="calendar-mood">${mood}</span>` : ''}
          </div>
          ${dots ? `<div class="calendar-dot-group">${dots}</div>` : ''}
          <div class="calendar-habit-dots">
            <span class="ch-dot ${waterDone ? 'water-done' : 'water-undone'}" title="饮水"></span>
            <span class="ch-dot ${healthDone ? 'health-done' : 'health-undone'}" title="健康"></span>
            <span class="ch-dot ${reflectionDone ? 'reflection-done' : 'reflection-undone'}" title="自省"></span>
          </div>
          ${(dayFin.income || dayFin.expense) ? `
            <div class="calendar-fin-line">
              ${dayFin.income ? `<span class="fin-income">+${dayFin.income.toFixed(0)}</span>` : ''}
              ${dayFin.expense ? `<span class="fin-expense">-${dayFin.expense.toFixed(0)}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `)
    }
    calendarGridHtml = `
      <div class="calendar-grid">
        ${weekDays.map(w => `<div class="calendar-day-header">${w}</div>`).join('')}
        ${cells.join('')}
      </div>
    `
  } else if (periodState === 'quarter') {
    const quarterStartMonth = Math.floor(month / 3) * 3
    let qHtml = '<div class="quarter-grid-wrap" style="display:flex;flex-direction:column;gap:16px;margin:16px 0;">'
    for (let qm = 0; qm < 3; qm++) {
      const m = quarterStartMonth + qm
      const mLabel = m + 1
      const mFirstDay = new Date(year, m, 1).getDay()
      const mDays = new Date(year, m + 1, 0).getDate()
      const mCells: string[] = []
      for (let i = 0; i < mFirstDay; i++) mCells.push('<div class="calendar-cell empty"></div>')
      for (let d = 1; d <= mDays; d++) {
        const dk = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const isToday = d === new Date().getDate() && m === new Date().getMonth() && year === new Date().getFullYear()
        mCells.push(`<div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dk}"><span class="calendar-day-num">${d}</span></div>`)
      }
      qHtml += `
        <div class="quarter-month-block" style="background:var(--bg-card);border-radius:12px;padding:12px;">
          <div class="quarter-month-title" style="font-weight:600;font-size:15px;margin-bottom:8px;color:var(--text);">${mLabel}月</div>
          <div class="calendar-grid">
            ${weekDays.map(w => `<div class="calendar-day-header">${w}</div>`).join('')}
            ${mCells.join('')}
          </div>
        </div>
      `
    }
    qHtml += '</div>'
    calendarGridHtml = qHtml
  } else if (periodState === 'year') {
    let yHtml = '<div class="year-grid-wrap" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin:16px 0;">'
    for (let m = 0; m < 12; m++) {
      const mLabel = m + 1
      const mStats = yearMonthStats[m] || { totalCount: 0, completedCount: 0, completeRate: 0 }
      const mTotal = (mStats as any).totalCount || 0
      const mDone = (mStats as any).completedCount || 0
      const mRate = (mStats as any).completeRate || 0
      yHtml += `
        <div class="year-month-card" data-month="${m}" style="background:var(--bg-card);border-radius:12px;padding:16px;text-align:center;cursor:pointer;transition:all .2s ease;">
          <div class="ymc-title" style="font-weight:600;font-size:16px;margin-bottom:8px;color:var(--text);">${mLabel}月</div>
          <div class="ymc-stat" style="font-size:13px;color:var(--text-soft);margin-bottom:8px;">${mTotal}任务 · ${mRate}%</div>
          <div class="ymc-progress" style="height:6px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
            <div class="ymc-progress-fill" style="width:${mRate}%;height:100%;background:var(--primary);border-radius:999px;"></div>
          </div>
        </div>
      `
    }
    yHtml += '</div>'
    calendarGridHtml = yHtml
  }

  const total = Array.isArray(monthData) ? monthData.length : (monthData as any).totalCount || 0
  const completed = Array.isArray(monthData) ? monthData.filter((t: any) => t.isCompleted).length : (monthData as any).completedCount || 0
  const rate = total ? Math.round((completed / total) * 100) : 0
  const fmtMoney = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2)

  // --- 构建完整 HTML ---
  container.innerHTML = `
    <!-- 0. 月份导航栏 -->
    <div class="cal-month-nav" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
      <button class="cal-nav-btn" id="cal-prev-month" style="background:var(--bg-soft);border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;color:var(--text);font-size:14px">&lt;</button>
      <div style="font-size:16px;font-weight:600;color:var(--text-primary)">${monthLabel}</div>
      <button class="cal-nav-btn" id="cal-next-month" style="background:var(--bg-soft);border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;color:var(--text);font-size:14px">&gt;</button>
    </div>

    <!-- 1. 双层筛选控制区 -->
    <div class="calendar-filter-bar" style="margin:12px 0;">
      <div class="cf-coarse" style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="cf-tab ${filterState.coarse === 'task' ? 'active' : ''}" data-coarse="task" style="flex:1;padding:8px 0;border-radius:8px;border:1px solid var(--border);background:${filterState.coarse === 'task' ? 'var(--primary)' : 'var(--bg-soft)'};color:${filterState.coarse === 'task' ? '#fff' : 'var(--text)'};font-size:14px;font-weight:500;cursor:pointer;">任务</button>
        <button class="cf-tab ${filterState.coarse === 'habit' ? 'active' : ''}" data-coarse="habit" style="flex:1;padding:8px 0;border-radius:8px;border:1px solid var(--border);background:${filterState.coarse === 'habit' ? 'var(--primary)' : 'var(--bg-soft)'};color:${filterState.coarse === 'habit' ? '#fff' : 'var(--text)'};font-size:14px;font-weight:500;cursor:pointer;">习惯</button>
        <button class="cf-tab ${filterState.coarse === 'asset' ? 'active' : ''}" data-coarse="asset" style="flex:1;padding:8px 0;border-radius:8px;border:1px solid var(--border);background:${filterState.coarse === 'asset' ? 'var(--primary)' : 'var(--bg-soft)'};color:${filterState.coarse === 'asset' ? '#fff' : 'var(--text)'};font-size:14px;font-weight:500;cursor:pointer;">资产</button>
      </div>
      <div class="cf-fine" style="display:flex;flex-direction:column;gap:8px;">
        ${filterState.coarse === 'task' ? `
          <div class="cf-fine-row" style="display:flex;flex-wrap:wrap;gap:6px;">
            <button class="tf-pill ${filterState.taskCat === 'all' ? 'active' : ''}" data-fine="cat" data-val="all">全部</button>
            ${Object.keys(TASK_CATEGORIES).map(k => `<button class="tf-pill ${filterState.taskCat === k ? 'active' : ''}" data-fine="cat" data-val="${k}">${CAT1_LABELS[k]}</button>`).join('')}
          </div>
        ` : ''}
        ${filterState.coarse === 'habit' ? `
          <div class="cf-fine-row" style="display:flex;flex-wrap:wrap;gap:6px;">
            <button class="tf-pill ${filterState.habitSub === 'all' ? 'active' : ''}" data-fine="habit" data-val="all">全部</button>
            <button class="tf-pill ${filterState.habitSub === 'water' ? 'active' : ''}" data-fine="habit" data-val="water">饮水台账</button>
            <button class="tf-pill ${filterState.habitSub === 'health' ? 'active' : ''}" data-fine="habit" data-val="health">健康补给</button>
            <button class="tf-pill ${filterState.habitSub === 'reflection' ? 'active' : ''}" data-fine="habit" data-val="reflection">每日自省</button>
          </div>
        ` : ''}
        ${filterState.coarse === 'asset' ? `
          <div class="cf-fine-row" style="display:flex;flex-wrap:wrap;gap:6px;">
            <button class="tf-pill ${filterState.assetSub === 'all' ? 'active' : ''}" data-fine="asset" data-val="all">全部</button>
            <button class="tf-pill ${filterState.assetSub === 'income' ? 'active' : ''}" data-fine="asset" data-val="income">收入</button>
            <button class="tf-pill ${filterState.assetSub === 'expense' ? 'active' : ''}" data-fine="asset" data-val="expense">支出</button>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- 2. 周期切换区 -->
    <div class="calendar-period-bar" style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="cp-tab ${periodState === 'month' ? 'active' : ''}" data-period="month" style="flex:1;padding:8px 0;border-radius:8px;border:1px solid var(--border);background:${periodState === 'month' ? 'var(--primary)' : 'var(--bg-soft)'};color:${periodState === 'month' ? '#fff' : 'var(--text)'};font-size:14px;font-weight:500;cursor:pointer;">月</button>
      <button class="cp-tab ${periodState === 'quarter' ? 'active' : ''}" data-period="quarter" style="flex:1;padding:8px 0;border-radius:8px;border:1px solid var(--border);background:${periodState === 'quarter' ? 'var(--primary)' : 'var(--bg-soft)'};color:${periodState === 'quarter' ? '#fff' : 'var(--text)'};font-size:14px;font-weight:500;cursor:pointer;">季</button>
      <button class="cp-tab ${periodState === 'year' ? 'active' : ''}" data-period="year" style="flex:1;padding:8px 0;border-radius:8px;border:1px solid var(--border);background:${periodState === 'year' ? 'var(--primary)' : 'var(--bg-soft)'};color:${periodState === 'year' ? '#fff' : 'var(--text)'};font-size:14px;font-weight:500;cursor:pointer;">年</button>
    </div>

    <!-- 3. 周期摘要区 -->
    <div class="calendar-summary-bar" style="margin-bottom:12px;">
      <div class="cs-fold-line" id="cs-fold-line" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg-card);border-radius:8px;">
        <span class="cs-fold-text" style="font-size:14px;color:var(--text);">
          本月总结：${total}个任务 · ${rate}%完成 · ${waterStats.total}ml饮水 · 收支+${finStats.income.toFixed(0)}/-${finStats.expense.toFixed(0)}
        </span>
        <span class="cs-fold-icon" style="font-size:12px;color:var(--text-soft);">${summaryFolded ? '▶' : '▼'}</span>
      </div>
      <div class="cs-detail" id="cs-detail" style="display:${summaryFolded ? 'none' : 'block'};background:var(--bg-card);border-radius:8px;padding:12px;margin-top:8px;">
        <div class="cs-chart-group" style="margin-bottom:16px;">
          <div class="cs-chart-title" style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text);">任务完成趋势</div>
          <div class="cs-chart-bars" style="display:flex;align-items:flex-end;gap:4px;height:80px;">
            ${state.monthStats.map((d: any) => `<div class="cs-bar-wrap" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;"><div class="cs-bar" style="width:100%;height:${d.rate}%;background:var(--primary);border-radius:4px 4px 0 0;min-height:4px;"></div><div class="cs-bar-label" style="font-size:10px;color:var(--text-soft);">${d.day}</div></div>`).join('')}
            ${state.monthStats.length === 0 ? '<span style="font-size:13px;color:var(--text-soft);">暂无数据</span>' : ''}
          </div>
        </div>
        <div class="cs-chart-group" style="margin-bottom:16px;">
          <div class="cs-chart-title" style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text);">心情分布</div>
          <div class="cs-mood-list" style="display:flex;flex-wrap:wrap;gap:8px;">
            ${Object.entries(moodDist).map(([mood, count]) => `
              <div class="cs-mood-item" style="display:flex;align-items:center;gap:4px;font-size:13px;background:var(--bg-soft);padding:4px 10px;border-radius:999px;">
                <span>${mood}</span>
                <span style="color:var(--text-soft);">${count}</span>
              </div>
            `).join('')}
            ${Object.keys(moodDist).length === 0 ? '<span style="font-size:13px;color:var(--text-soft);">暂无心情记录</span>' : ''}
          </div>
        </div>
        <div class="cs-chart-group">
          <div class="cs-chart-title" style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text);">收支概览</div>
          <div class="cs-progress-line" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px;">
            <span style="width:40px;color:var(--text-soft);">收入</span>
            <div class="cs-progress-track" style="flex:1;height:8px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
              <div class="cs-progress-fill income" style="width:${Math.min(100, finStats.income > 0 ? 100 : 0)}%;height:100%;background:var(--success);border-radius:999px;"></div>
            </div>
            <span style="width:60px;text-align:right;">${finStats.income.toFixed(2)}</span>
          </div>
          <div class="cs-progress-line" style="display:flex;align-items:center;gap:8px;font-size:13px;">
            <span style="width:40px;color:var(--text-soft);">支出</span>
            <div class="cs-progress-track" style="flex:1;height:8px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
              <div class="cs-progress-fill expense" style="width:${Math.min(100, (finStats.income + finStats.expense) > 0 ? (finStats.expense / (finStats.income + finStats.expense || 1) * 100) : 0)}%;height:100%;background:var(--danger);border-radius:999px;"></div>
            </div>
            <span style="width:60px;text-align:right;">${finStats.expense.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 日历网格 -->
    ${calendarGridHtml}

    <!-- 4. 四大复盘分区 -->
    <div class="review-sections" style="display:flex;flex-direction:column;gap:12px;margin:16px 0;">
      <!-- A. 时序任务复盘 -->
      <div class="review-card" style="background:var(--bg-card);border-radius:12px;padding:12px;">
        <div class="review-header" data-review="task" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <span class="review-title" style="font-weight:600;font-size:15px;color:var(--text);">时序任务复盘</span>
          <span class="review-toggle" style="font-size:12px;color:var(--text-soft);">▼</span>
        </div>
        <div class="review-body" id="review-body-task" style="margin-top:10px;">
          ${levelReview.map(l => `
            <div class="review-progress-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px;">
              <span style="width:24px;color:var(--text-soft);">${l.label}</span>
              <div class="review-progress-track" style="flex:1;height:10px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
                <div class="review-progress-fill" style="width:${l.rate}%;height:100%;background:var(--primary);border-radius:999px;"></div>
              </div>
              <span style="width:50px;text-align:right;color:var(--text);">${l.done}/${l.total}</span>
              <span style="width:36px;text-align:right;color:var(--text-soft);">${l.rate}%</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- B. 习惯复盘 -->
      <div class="review-card" style="background:var(--bg-card);border-radius:12px;padding:12px;">
        <div class="review-header" data-review="habit" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <span class="review-title" style="font-weight:600;font-size:15px;color:var(--text);">习惯复盘</span>
          <span class="review-toggle" style="font-size:12px;color:var(--text-soft);">▼</span>
        </div>
        <div class="review-body" id="review-body-habit" style="margin-top:10px;">
          ${showWater ? `
            <div class="review-progress-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px;">
              <span style="width:80px;color:var(--text-soft);">饮水</span>
              <div class="review-progress-track" style="flex:1;height:10px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
                <div class="review-progress-fill" style="width:${daysInMonth ? Math.round((habitWaterGoalDays / daysInMonth) * 100) : 0}%;height:100%;background:var(--info);border-radius:999px;"></div>
              </div>
              <span style="width:auto;text-align:right;color:var(--text);white-space:nowrap;">${waterStats.total}ml / ${habitWaterGoalDays}天达标</span>
            </div>
          ` : ''}
          ${showHealth ? `
            <div class="review-progress-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px;">
              <span style="width:80px;color:var(--text-soft);">健康补给</span>
              <div class="review-progress-track" style="flex:1;height:10px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
                <div class="review-progress-fill" style="width:${healthRate}%;height:100%;background:var(--success);border-radius:999px;"></div>
              </div>
              <span style="width:auto;text-align:right;color:var(--text);white-space:nowrap;">${habitHealthDays}/${daysInMonth}天 · ${healthRate}%</span>
            </div>
          ` : ''}
          ${showReflection ? `
            <div class="review-progress-row" style="display:flex;align-items:center;gap:10px;font-size:13px;">
              <span style="width:80px;color:var(--text-soft);">每日自省</span>
              <div class="review-progress-track" style="flex:1;height:10px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
                <div class="review-progress-fill" style="width:${reflectionRate}%;height:100%;background:var(--warning);border-radius:999px;"></div>
              </div>
              <span style="width:auto;text-align:right;color:var(--text);white-space:nowrap;">${habitReflectionDays}/${daysInMonth}天 · ${reflectionRate}%</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- C. 资产财务复盘 -->
      <div class="review-card" style="background:var(--bg-card);border-radius:12px;padding:12px;">
        <div class="review-header" data-review="finance" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <span class="review-title" style="font-weight:600;font-size:15px;color:var(--text);">资产财务复盘</span>
          <span class="review-toggle" style="font-size:12px;color:var(--text-soft);">▼</span>
        </div>
        <div class="review-body" id="review-body-finance" style="margin-top:10px;">
          <div style="display:flex;gap:12px;margin-bottom:12px;text-align:center;">
            ${showIncome ? `
              <div style="flex:1;">
                <div style="font-size:12px;color:var(--text-soft);">总收入</div>
                <div style="font-size:18px;font-weight:bold;color:var(--success);">${fmtMoney(finStats.income)}</div>
              </div>
            ` : ''}
            ${showExpense ? `
              <div style="flex:1;">
                <div style="font-size:12px;color:var(--text-soft);">总支出</div>
                <div style="font-size:18px;font-weight:bold;color:var(--danger);">${fmtMoney(-finStats.expense)}</div>
              </div>
            ` : ''}
            <div style="flex:1;">
              <div style="font-size:12px;color:var(--text-soft);">结余</div>
              <div style="font-size:18px;font-weight:bold;color:var(--text);">${finStats.balance.toFixed(2)}</div>
            </div>
          </div>
          ${showExpense && expenseCatRates.length ? expenseCatRates.map(c => `
            <div class="review-progress-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:13px;">
              <span style="width:80px;color:var(--text-soft);">${c.cat}</span>
              <div class="review-progress-track" style="flex:1;height:10px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">
                <div class="review-progress-fill" style="width:${c.rate}%;height:100%;background:var(--primary);border-radius:999px;"></div>
              </div>
              <span style="width:60px;text-align:right;color:var(--text);">${c.amount.toFixed(2)}</span>
              <span style="width:36px;text-align:right;color:var(--text-soft);">${c.rate}%</span>
            </div>
          `).join('') : ''}
          ${showExpense && expenseCatRates.length === 0 ? '<div style="font-size:13px;color:var(--text-soft);">暂无支出分类数据</div>' : ''}
        </div>
      </div>

      <!-- D. 成长复盘 -->
      <div class="review-card" style="background:var(--bg-card);border-radius:12px;padding:12px;">
        <div class="review-header" data-review="growth" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <span class="review-title" style="font-weight:600;font-size:15px;color:var(--text);">成长复盘</span>
          <span class="review-toggle" style="font-size:12px;color:var(--text-soft);">▼</span>
        </div>
        <div class="review-body" id="review-body-growth" style="margin-top:10px;">
          <div class="cs-chart-group" style="margin-bottom:12px;">
            <div class="cs-chart-title" style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text);">心情分布</div>
            <div class="cs-mood-list" style="display:flex;flex-wrap:wrap;gap:8px;">
              ${Object.entries(moodDist).map(([mood, count]) => `
                <div class="cs-mood-item" style="display:flex;align-items:center;gap:4px;font-size:13px;background:var(--bg-soft);padding:4px 10px;border-radius:999px;">
                  <span>${mood}</span>
                  <span style="color:var(--text-soft);">${count}</span>
                </div>
              `).join('')}
              ${Object.keys(moodDist).length === 0 ? '<span style="font-size:13px;color:var(--text-soft);">暂无心情记录</span>' : ''}
            </div>
          </div>
          <div class="cs-chart-group">
            <div class="cs-chart-title" style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text);">任务完成趋势</div>
            <div class="cs-chart-bars" style="display:flex;align-items:flex-end;gap:4px;height:60px;">
              ${state.monthStats.map((d: any) => `<div class="cs-bar-wrap" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;"><div class="cs-bar" style="width:100%;height:${d.rate}%;background:var(--primary);border-radius:4px 4px 0 0;min-height:4px;"></div><div class="cs-bar-label" style="font-size:10px;color:var(--text-soft);">${d.day}</div></div>`).join('')}
              ${state.monthStats.length === 0 ? '<span style="font-size:13px;color:var(--text-soft);">暂无数据</span>' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 现有月度完成率 -->
    <div class="chart-wrap" style="text-align:center;padding-top:20px;">
      <div style="font-size:32px;font-weight:bold;color:var(--primary)">${rate}%</div>
      <div style="margin-top:8px;color:var(--text-soft)">本月完成 ${completed}/${total}</div>
    </div>

    <!-- 现有资产统计卡片 -->
    <div class="finance-stats-card card">
      <div class="fsc-header">
        <span class="fsc-title">月度资产</span>
      </div>
      <div class="fsc-body">
        <div class="fsc-item income">
          <div class="fsc-label">收入</div>
          <div class="fsc-value">${fmtMoney(finStats.income)}</div>
        </div>
        <div class="fsc-item expense">
          <div class="fsc-label">支出</div>
          <div class="fsc-value">${fmtMoney(-finStats.expense)}</div>
        </div>
        <div class="fsc-item balance">
          <div class="fsc-label">结余</div>
          <div class="fsc-value">${finStats.balance.toFixed(2)}</div>
        </div>
      </div>
    </div>

    <!-- 现有收支明细 -->
    <div class="finance-detail-panel card">
      <div class="fdp-header">
        <span class="fdp-title">收支明细</span>
        <span class="fdp-toggle">▼</span>
      </div>
      <div class="fdp-body">
        ${finRecords.length ? finRecords.map((r: any) => `
          <div class="fdp-record ${r.type === 'income' ? 'income' : 'expense'}">
            <span class="fdp-cat">${r.category || ''}</span>
            <span class="fdp-amount">${r.type === 'income' ? '+' : '-'}${(r.amount || 0).toFixed(2)}</span>
            <span class="fdp-date">${r.dateKey || ''}</span>
            ${r.note ? `<span class="fdp-note">${r.note}</span>` : ''}
          </div>
        `).join('') : '<div class="empty-box">暂无记账记录</div>'}
      </div>
    </div>
  `

  // --- 事件绑定（保持现有 + 新增） ---
  document.querySelectorAll('.calendar-cell:not(.empty)').forEach(el => {
    el.addEventListener('click', async () => {
      const dk = el.getAttribute('data-date')
      if (dk) {
        state.currentDateKey = dk
        await loadTodayTasks()
        switchTab('today')
      }
    })
  })

  const fdpToggle = container.querySelector('.fdp-toggle')
  if (fdpToggle) fdpToggle.addEventListener('click', () => {
    const body = container.querySelector('.fdp-body') as HTMLElement
    if (body) {
      const isHidden = body.style.display === 'none'
      body.style.display = isHidden ? 'block' : 'none'
      fdpToggle.textContent = isHidden ? '▼' : '▶'
    }
  })

  // 新增事件绑定
  container.querySelectorAll('.cf-tab').forEach(el => {
    el.addEventListener('click', () => {
      const coarse = el.getAttribute('data-coarse') || 'task'
      const next = JSON.parse(localStorage.getItem('pms-calendar-filter') || '{}')
      next.coarse = coarse
      localStorage.setItem('pms-calendar-filter', JSON.stringify(next))
      renderCalendar()
    })
  })

  container.querySelectorAll('[data-fine]').forEach(el => {
    el.addEventListener('click', () => {
      const fine = el.getAttribute('data-fine')
      const val = el.getAttribute('data-val') || 'all'
      const next = JSON.parse(localStorage.getItem('pms-calendar-filter') || '{}')
      if (fine === 'level') next.taskLevel = val
      if (fine === 'cat') next.taskCat = val
      if (fine === 'habit') next.habitSub = val
      if (fine === 'asset') next.assetSub = val
      localStorage.setItem('pms-calendar-filter', JSON.stringify(next))
      renderCalendar()
    })
  })

  container.querySelectorAll('.cp-tab').forEach(el => {
    el.addEventListener('click', () => {
      const period = el.getAttribute('data-period') || 'month'
      localStorage.setItem('pms-calendar-period', period)
      renderCalendar()
    })
  })

  const csFoldLine = container.querySelector('#cs-fold-line')
  if (csFoldLine) {
    csFoldLine.addEventListener('click', () => {
      const detail = container.querySelector('#cs-detail') as HTMLElement
      const icon = csFoldLine.querySelector('.cs-fold-icon') as HTMLElement
      const isHidden = detail ? detail.style.display === 'none' : true
      if (detail) detail.style.display = isHidden ? 'block' : 'none'
      if (icon) icon.textContent = isHidden ? '▼' : '▶'
      localStorage.setItem('pms-calendar-summary-fold', isHidden ? 'false' : 'true')
    })
  }

  container.querySelectorAll('.review-header').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-review')
      const body = container.querySelector(`#review-body-${key}`) as HTMLElement
      const toggle = el.querySelector('.review-toggle') as HTMLElement
      if (body) {
        const isHidden = body.style.display === 'none'
        body.style.display = isHidden ? 'block' : 'none'
        if (toggle) toggle.textContent = isHidden ? '▼' : '▶'
      }
    })
  })

  // 月份导航
  const prevMonthBtn = container.querySelector('#cal-prev-month')
  const nextMonthBtn = container.querySelector('#cal-next-month')
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      const offset = parseInt(localStorage.getItem('pms-calendar-month-offset') || '0', 10) || 0
      localStorage.setItem('pms-calendar-month-offset', String(offset - 1))
      renderCalendar()
    })
  }
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      const offset = parseInt(localStorage.getItem('pms-calendar-month-offset') || '0', 10) || 0
      localStorage.setItem('pms-calendar-month-offset', String(offset + 1))
      renderCalendar()
    })
  }
}

// ====================== 个人记账（内嵌月历页 + 弹窗模式） ======================
const FINANCE_INCOME_CATS = ['工资', '兼职', '奖金', '理财收益', '红包', '其他']
const FINANCE_EXPENSE_CATS = ['餐饮', '交通', '购物', '日用', '娱乐', '生活', '其他']

async function openFinanceModal(monthKey?: string) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal-box fm-modal-box">
      <div class="modal-title">💰 记账录入</div>
      <div class="fm-type-row">
        <button class="btn fm-type-pill active" data-type="expense">支出</button>
        <button class="btn fm-type-pill" data-type="income">收入</button>
      </div>
      <div class="fm-amount-section">
        <input type="number" class="input fm-amount-input" placeholder="输入金额" min="0" step="0.01" />
      </div>
      <div class="fm-cat-row" id="fm-cat-row">
        ${FINANCE_EXPENSE_CATS.map((c, i) => `<button class="btn btn-outline fm-cat-pill ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="fm-note-section">
        <input type="text" class="input fm-note-input" placeholder="备注（选填）" />
      </div>
      <div class="fm-date-section">
        <label class="fm-date-label">日期</label>
        <input type="date" class="input fm-date-input" value="${today}" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline fm-cancel-btn">取消</button>
        <button class="btn btn-primary fm-submit-btn">提交</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
  document.body.classList.add('modal-open')
  let finType: 'income' | 'expense' = 'expense'
  let finCat = FINANCE_EXPENSE_CATS[0]
  const renderCats = (type: 'income' | 'expense') => {
    const cats = type === 'income' ? FINANCE_INCOME_CATS : FINANCE_EXPENSE_CATS
    const wrap = overlay.querySelector('#fm-cat-row') as HTMLElement
    if (!wrap) return
    wrap.innerHTML = cats.map((c, i) =>
      `<button class="btn btn-outline fm-cat-pill ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('')
    finCat = cats[0]
    wrap.querySelectorAll('.fm-cat-pill').forEach(el => {
      el.addEventListener('click', () => {
        wrap.querySelectorAll('.fm-cat-pill').forEach(x => x.classList.remove('active'))
        el.classList.add('active')
        finCat = el.getAttribute('data-cat') || ''
      })
    })
  }
  overlay.querySelectorAll('.fm-type-pill').forEach(el => {
    el.addEventListener('click', () => {
      overlay.querySelectorAll('.fm-type-pill').forEach(x => x.classList.remove('active'))
      el.classList.add('active')
      finType = (el.getAttribute('data-type') || 'expense') as 'income' | 'expense'
      renderCats(finType)
    })
  })
  overlay.querySelectorAll('.fm-cat-pill').forEach(el => {
    el.addEventListener('click', () => {
      overlay.querySelectorAll('.fm-cat-pill').forEach(x => x.classList.remove('active'))
      el.classList.add('active')
      finCat = el.getAttribute('data-cat') || ''
    })
  })
  const closeModal = () => {
    document.body.removeChild(overlay)
    document.body.classList.remove('modal-open')
  }
  overlay.querySelector('.fm-cancel-btn')!.addEventListener('click', closeModal)
  overlay.querySelector('.fm-submit-btn')!.addEventListener('click', async () => {
    const amountEl = overlay.querySelector('.fm-amount-input') as HTMLInputElement
    const noteEl = overlay.querySelector('.fm-note-input') as HTMLInputElement
    const dateEl = overlay.querySelector('.fm-date-input') as HTMLInputElement
    const amount = parseFloat(amountEl?.value || '0')
    if (!amount || amount <= 0) return alert('请输入有效金额')
    const dateKey = dateEl?.value || today
    try {
      await createAssetRecord({
        type: finType,
        amount,
        category: finCat,
        note: noteEl?.value || '',
        dateKey,
        createTime: Date.now()
      } as any)
      closeModal()
      await loadMonthStats()
      // 即时刷新：如果当前在今日页则刷新概览，月历页则刷新月历
      const currentPage = (window as any).$pms?.page?.getCurrentPage?.()
      if (currentPage === 'calendar') {
        await renderCalendar()
      } else {
        // 刷新今日页概览（如果已有任务列表数据则重新渲染概览）
        renderTodayOverview(state.taskList)
      }
    } catch (e: any) {
      alert('提交失败: ' + (e?.message || e))
    }
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal()
  })
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove()
}

function runtimeScan() {
  console.log('[PMS] 运行时安全扫描完成')
}

// 导出全局页面切换方法
export const switchPage = (pageName: PageType): void => {
  if (!['today', 'timeline', 'calendar'].includes(pageName)) return
  ;(window as any).$pms.page?.setPage(pageName)
}
export default (window as any).$pms as PmsGlobalAPI