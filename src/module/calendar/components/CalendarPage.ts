/**
 * 月历复盘页面｜全域只读域
 */
import { getMonthRange, getLocalDateKey, getUTCNow } from '../../../common/utils/date'
import { getTodayTasks } from '../../../service/db-time'
import { EventBus } from '../../../common/event/bus'
import { GestureCore } from '../../../common/gesture/core'

export default class CalendarPage {
  private static currentMonthTs = Date.now()
  private static pageMounted = false

  private static generateMonthGrid(year: number, month: number) {
    const gridData: Array<{
      dateKey: string; day: number; isToday: boolean; isCurrentMonth: boolean
      taskCount: number; completedCount: number
    }> = []
    const todayKey = getLocalDateKey(getUTCNow())
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const totalDays = lastDay.getDate()
    let firstWeekDay = (firstDay.getDay() || 7)

    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = 0; i < firstWeekDay - 1; i++) {
      const day = prevMonthDays - (firstWeekDay - 2 - i)
      const dateKey = `${year}-${String(month - 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      gridData.push({ dateKey, day, isToday: dateKey === todayKey, isCurrentMonth: false, taskCount: 0, completedCount: 0 })
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      gridData.push({ dateKey, day: d, isToday: dateKey === todayKey, isCurrentMonth: true, taskCount: 0, completedCount: 0 })
    }

    const restCount = 42 - gridData.length
    for (let d = 1; d <= restCount; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      gridData.push({ dateKey, day: d, isToday: dateKey === todayKey, isCurrentMonth: false, taskCount: 0, completedCount: 0 })
    }

    return gridData
  }

  static async render(): Promise<string> {
    const nowDate = new Date(this.currentMonthTs)
    const currYear = nowDate.getFullYear()
    const currMonth = nowDate.getMonth() + 1

    const monthGrid = this.generateMonthGrid(currYear, currMonth)

    return `
      <div class="page-header" style="margin-bottom:20px">
        <h2 style="font-size:22px;font-weight:600">月度复盘｜${currYear}年${currMonth}月</h2>
      </div>
      <div class="card">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:8px">
          ${['一','二','三','四','五','六','日'].map(w=>`<div style="text-align:center;font-size:13px;color:var(--text-hint);padding:4px">周${w}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
          ${monthGrid.map(cell => {
            if (!cell.isCurrentMonth) return `<div style="aspect-ratio:1/1;padding:2px;background:transparent;color:#e5e7eb;text-align:center;font-size:12px">${cell.day}</div>`
            const todayStyle = cell.isToday ? 'border:2px solid var(--color-ecology);font-weight:700;border-radius:6px' : ''
            return `<div style="aspect-ratio:1/1;padding:2px;${todayStyle};text-align:center;font-size:12px;display:flex;flex-direction:column;justify-content:center;align-items:center"><span>${cell.day}</span></div>`
          }).join('')}
        </div>
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--bg-page);border-radius:10px;text-align:center;color:var(--text-hint);font-size:13px">
        📅 月历复盘为全域只读域，所有数据请在【今日工作台】修改
      </div>
    `
  }

  static mountEvent() {
    if (this.pageMounted) return
    this.pageMounted = true
  }
}