/**
 * @file 今日域-回收站组件
 */
import { restoreRecycleTask, softDeleteTask } from '../../../service/db-time'
import { EventBus } from '../../../common/event/bus'
import { escapeHtml } from '../../../common/utils/dom'

export const RECYCLE_RETENTION_DAYS = 7
export const RECYCLE_RETENTION_MS = RECYCLE_RETENTION_DAYS * 24 * 60 * 60 * 1000

export interface RecycleTaskItem {
  id: number
  title: string
  deleteTime: number
  expireTime: number
  dateKey: string
}

export default class RecycleBin {
  private static container: HTMLElement | null = null
  private static visible = false

  static init(containerSelector: string): void {
    this.container = document.querySelector(containerSelector) as HTMLElement
  }

  static async open(tasks: RecycleTaskItem[]): Promise<void> {
    if (!this.container) return
    this.visible = true
    this.container.innerHTML = await this.render(tasks)
    this.container.style.display = 'block'
  }

  static close(): void {
    if (!this.container) return
    this.visible = false
    this.container.style.display = 'none'
  }

  private static async render(tasks: RecycleTaskItem[]): Promise<string> {
    const now = Date.now()
    if (tasks.length === 0) {
      return `
        <div class="recycle-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px">
          <div class="recycle-card" style="width:100%;max-width:420px;background:#fff;border-radius:12px;padding:20px">
            <h3 style="margin:0">🗑️ 任务回收站</h3>
            <p style="text-align:center;color:var(--text-hint);padding:20px 0">回收站暂无已删除任务</p>
          </div>
        </div>
      `
    }

    const listHtml = tasks.map(task => {
      const leftDay = Math.ceil((task.expireTime - now) / (24 * 60 * 60 * 1000))
      return `
        <div class="recycle-item" data-task-id="${task.id}" style="padding:10px;border-bottom:1px solid var(--border-light)">
          <div style="font-weight:500">${escapeHtml(task.title)}</div>
          <div style="font-size:12px;color:var(--text-hint);margin:4px 0">剩余${leftDay}天过期</div>
          <button class="recycle-restore-btn" data-id="${task.id}" style="padding:4px 10px;background:var(--color-ecology);color:white;border:none;border-radius:6px;font-size:12px">恢复任务</button>
        </div>
      `
    }).join('')

    return `
      <div class="recycle-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px">
        <div class="recycle-card" style="width:100%;max-width:420px;background:#fff;border-radius:12px;padding:20px;max-height:80vh;display:flex;flex-direction:column">
          <h3 style="margin:0">🗑️ 任务回收站 (${tasks.length})</h3>
          <div style="overflow:auto;flex:1">${listHtml}</div>
        </div>
      </div>
    `
  }
}