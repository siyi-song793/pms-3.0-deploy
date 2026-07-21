/**
 * Layer1+Layer2 业务路由层 - 全局TAB导航管理器
 * 遵循分层规约：路由仅管控页面切换与生命周期，不侵入业务数据逻辑
 */
import { EventBus } from '../common/event/bus'
import { GestureCore } from '../common/gesture/core'

/** TAB路由枚举 */
export enum TabRouteKey {
  TODAY = 'today',
  TIMELINE = 'timeline',
  CALENDAR = 'calendar',
  WATER = 'water',
  FINANCE = 'finance'
}

interface RouteMeta {
  key: TabRouteKey
  label: string
  icon: string
  isReadOnly: boolean
}

export class TabRouter {
  private readonly bus: EventBus
  private currentRoute: TabRouteKey = TabRouteKey.TODAY
  private readonly routeList: RouteMeta[]
  private pageContainer: HTMLElement | null = null
  private tabBarContainer: HTMLElement | null = null

  constructor(eventBus: EventBus) {
    this.bus = eventBus
    this.routeList = [
      { key: TabRouteKey.TODAY, label: '今日', icon: '📋', isReadOnly: false },
      { key: TabRouteKey.TIMELINE, label: '时间轴', icon: '⏱️', isReadOnly: true },
      { key: TabRouteKey.CALENDAR, label: '复盘', icon: '📊', isReadOnly: true },
      { key: TabRouteKey.WATER, label: '饮水', icon: '💧', isReadOnly: false },
      { key: TabRouteKey.FINANCE, label: '记账', icon: '💰', isReadOnly: false }
    ]
    this.registerGlobalRouteEvent()
  }

  init(): void {
    const appRoot = document.getElementById('app')
    if (!appRoot) throw new Error('应用根容器#app未找到')

    appRoot.innerHTML = `
      <div class="page-container" style="padding:16px;padding-bottom:80px;min-height:100vh;box-sizing:border-box"></div>
      <div class="tab-bar" style="position:fixed;bottom:0;left:0;right:0;height:64px;background:var(--bg-page);border-top:1px solid var(--bg-layer);display:flex;z-index:1000">
        ${this.routeList.map(route => `
          <div class="tab-item ${route.key === this.currentRoute ? 'active' : ''}" data-route-key="${route.key}"
            style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;
            color:${route.key === this.currentRoute ? 'var(--color-ecology)' : 'var(--text-secondary)'};">
            <div style="font-size:20px">${route.icon}</div>
            <div style="font-size:12px">${route.label}</div>
          </div>
        `).join('')}
      </div>
    `

    this.pageContainer = appRoot.querySelector('.page-container')
    this.tabBarContainer = appRoot.querySelector('.tab-bar')
    this.bindTabClickEvent()
    this.switchRoute(this.currentRoute)
  }

  async switchRoute(targetKey: TabRouteKey): Promise<void> {
    if (this.currentRoute === targetKey || !this.pageContainer) return
    this.currentRoute = targetKey
    const targetRouteMeta = this.routeList.find(r => r.key === targetKey)
    if (!targetRouteMeta) return

    this.tabBarContainer?.querySelectorAll('.tab-item').forEach(tab => {
      const key = tab.getAttribute('data-route-key')
      if (key === targetKey) {
        tab.classList.add('active')
        ;(tab as HTMLElement).style.color = 'var(--color-ecology)'
      } else {
        tab.classList.remove('active')
        ;(tab as HTMLElement).style.color = 'var(--text-secondary)'
      }
    })

    this.bus.emit('router:change', {
      current: targetKey,
      isReadOnly: targetRouteMeta.isReadOnly
    })

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  private bindTabClickEvent(): void {
    this.tabBarContainer?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const tabItem = target.closest('.tab-item') as HTMLElement | null
      if (!tabItem) return
      const routeKey = tabItem.getAttribute('data-route-key') as TabRouteKey
      this.switchRoute(routeKey)
    })
  }

  private registerGlobalRouteEvent(): void {
    this.bus.on('router:navigate', (targetKey: TabRouteKey) => {
      this.switchRoute(targetKey)
    })
    this.bus.on('router:force-to-today', () => {
      this.switchRoute(TabRouteKey.TODAY)
    })
  }

  getCurrentRoute(): { key: TabRouteKey; isReadOnly: boolean } {
    const meta = this.routeList.find(r => r.key === this.currentRoute)!
    return { key: this.currentRoute, isReadOnly: meta.isReadOnly }
  }
}