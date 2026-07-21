/**
 * 时间轴页｜全域只读域
 */
import { getWeekRange, getLocalDateKey, getUTCNow } from '../../../common/utils/date'
import { getTodayTasks } from '../../../service/db-time'
import { EventBus } from '../../../common/event/bus'
import { GestureCore } from '../../../common/gesture/core'

export default class TimelinePage {
  private static currentWeekTs = Date.now()
  private static pageMounted = false

  private static getWeekDateList(startTs: number, endTs: number) {
    const list: Array<{dateKey:string,day:number,weekText:string,isToday:boolean}> = []
    const dayMs = 24 * 60 * 60 * 1000
    const todayKey = getLocalDateKey(getUTCNow())
    const weekTextArr = ['周一','周二','周三','周四','周五','周六','周日']

    let currTs = startTs
    while(currTs <= endTs) {
      const dateKey = getLocalDateKey(currTs)
      const d = new Date(currTs)
      const weekIdx = (d.getDay() || 7) - 1
      list.push({ dateKey, day: d.getDate(), weekText: weekTextArr[weekIdx], isToday: dateKey === todayKey })
      currTs += dayMs
    }
    return list
  }

  static async render(): Promise<string> {
    const [startTs, endTs] = getWeekRange(this.currentWeekTs)
    const weekDateList = this.getWeekDateList(startTs, endTs)

    return `
      <div class="page-header" style="margin-bottom:16px">
        <h2 style="font-size:22px;font-weight:600">周时间轴</h2>
        <span>${weekDateList[0]?.dateKey || ''} 至 ${weekDateList[6]?.dateKey || ''}</span>
      </div>
      <div class="week-date-nav" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:12px">
        ${weekDateList.map(day => `
          <div style="text-align:center;padding:8px;border-radius:8px;${day.isToday ? 'background:var(--color-ecology);color:white;font-weight:600' : 'background:var(--bg-card)'}">
            <div style="font-size:13px">${day.weekText}</div>
            <div style="font-size:16px;margin-top:2px">${day.day}</div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--bg-page);border-radius:10px;text-align:center;color:var(--text-hint);font-size:13px">
        ⏳ 时间轴为全域只读域，仅用于预览，新增/修改任务请前往【今日工作台】
      </div>
    `
  }

  static mountEvent() {
    if (this.pageMounted) return
    this.pageMounted = true
  }
}