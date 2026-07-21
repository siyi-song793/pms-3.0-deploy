/**
 * 今日工作台｜唯一全域写入域
 */
import { getLocalDateKey, getUTCNow } from '../../../common/utils/date'
import { EventBus } from '../../../common/event/bus'
import { GestureCore } from '../../../common/gesture/core'
import { NamespaceStorage } from '../../../common/storage/namespace'
import { escapeHtml } from '../../../common/utils/dom'
import {
  createTodayTask,
  toggleTaskComplete,
  softDeleteTask,
  restoreRecycleTask,
  getTodayTasks,
} from '../../../service/db-time'
import { writeGuard } from '../../../service/middleware/permission'

/**
 * 今日工作台页面
 */
export default class TodayPage {
  private static pageMounted = false
  private static readonly todayStorage = new NamespaceStorage('pms_today_v3')

  private static inputCache = {
    taskTitle: '',
    taskPriority: 'normal' as 'normal' | 'urgent',
    taskRemark: ''
  }

  private static getTodayDateKey() {
    return getLocalDateKey(getUTCNow())
  }

  private static renderTaskInputForm() {
    const { taskTitle, taskPriority, taskRemark } = this.inputCache
    return `
      <div class="card" style="padding:16px;margin-bottom:16px">
        <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:600">➕ 新增今日待办</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          <input
            id="task-title-input"
            type="text"
            placeholder="输入任务名称"
            value="${escapeHtml(taskTitle)}"
            style="width:100%;padding:10px;border:1px solid var(--border-light);border-radius:8px;outline:none;font-size:14px"
            maxlength="64"
          />
          <textarea
            id="task-remark-input"
            placeholder="任务备注（选填）"
            style="width:100%;padding:10px;border:1px solid var(--border-light);border-radius:8px;outline:none;font-size:14px;min-height:60px;resize:none"
          >${escapeHtml(taskRemark)}</textarea>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;gap:8px">
              <label style="display:flex;align-items:center;gap:4px;font-size:14px">
                <input type="radio" name="priority" value="normal" ${taskPriority === 'normal' ? 'checked' : ''}/>
                普通任务
              </label>
              <label style="display:flex;align-items:center;gap:4px;font-size:14px">
                <input type="radio" name="priority" value="urgent" ${taskPriority === 'urgent' ? 'checked' : ''}/>
                🔴 紧急任务
              </label>
            </div>
            <button id="submit-task-btn" style="padding:8px 20px;background:var(--color-ecology);color:white;border:none;border-radius:8px;font-weight:500">
              提交任务
            </button>
          </div>
        </div>
      </div>
    `
  }

  static async render(): Promise<string> {
    const todayKey = this.getTodayDateKey()
    const todayTasks = await getTodayTasks(todayKey)

    return `
      <div class="page-header" style="margin-bottom:16px">
        <h2 style="font-size:22px;font-weight:600;margin:0">📅 今日工作台｜${todayKey}</h2>
        <p style="margin:4px 0 0 0;color:var(--text-hint);font-size:13px">唯一写入入口｜所有数据修改仅在此页面生效</p>
      </div>
      ${this.renderTaskInputForm()}
      ${this.renderTaskList(todayTasks)}
    `
  }

  private static renderTaskList(todayTasks: any[]) {
    if (todayTasks.length === 0) {
      return `<div class="card" style="padding:24px;text-align:center;color:var(--text-hint)">✅ 今日暂无待办任务</div>`
    }
    let listHtml = `<div class="card" style="padding:16px;margin-bottom:16px"><h3 style="margin:0 0 12px 0;font-size:16px">📋 今日待办列表</h3>`
    todayTasks.forEach((task: any) => {
      const priorityBorder = task.priority === 'urgent' ? 'var(--color-danger-red)' : 'var(--color-ecology)'
      const completedStyle = task.isCompleted ? 'text-decoration:line-through;color:var(--text-hint);opacity:0.7' : ''
      listHtml += `
        <div class="task-item" data-task-id="${task.id}" style="padding:12px;border-left:3px solid ${priorityBorder};background:var(--bg-page);border-radius:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1;${completedStyle}">
              <div style="font-weight:500;font-size:14px">${escapeHtml(task.content)}</div>
              <div style="font-size:11px;color:var(--text-hint);margin-top:6px">优先级：${task.priority === 'urgent' ? '紧急' : '普通'}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="task-status-btn" data-id="${task.id}" style="padding:4px 10px;border:none;border-radius:6px;font-size:12px;background:var(--color-ecology);color:white">${task.isCompleted ? '撤销完成' : '✅ 完成'}</button>
            <button class="task-delete-btn" data-id="${task.id}" style="padding:4px 10px;border:1px solid var(--text-hint);border-radius:6px;font-size:12px;background:transparent;color:var(--text-hint)">🗑️ 删除</button>
          </div>
        </div>
      `
    })
    listHtml += `</div>`
    return listHtml
  }

  static mountEvent() {
    if (this.pageMounted) return
    this.pageMounted = true

    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('task-status-btn')) {
        const taskId = target.dataset.id
        if (taskId) {
          await toggleTaskComplete(Number(taskId), true)
          const container = document.querySelector('.page-container') as HTMLElement
          if (container) {
            container.innerHTML = await this.render()
            this.pageMounted = false
            this.mountEvent()
          }
        }
      }
      if (target.classList.contains('task-delete-btn')) {
        const taskId = target.dataset.id
        if (taskId && confirm('确定删除？')) {
          await softDeleteTask(Number(taskId))
          const container = document.querySelector('.page-container') as HTMLElement
          if (container) {
            container.innerHTML = await this.render()
            this.pageMounted = false
            this.mountEvent()
          }
        }
      }
    })
  }
}