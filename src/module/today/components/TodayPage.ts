import { getToday } from '../../../service/db-time'
import { getTasksByDate } from '../../../service/db-asset'

export async function renderToday() {
  const app = document.getElementById('app')!
  const today = getToday()
  const tasks = await getTasksByDate(today)

  app.innerHTML = `
    <div class="tab-nav">
      <a href="javascript:go('/')" class="active">今日</a>
      <a href="javascript:go('/timeline')">时间轴</a>
      <a href="javascript:go('/calendar')">月历</a>
    </div>
    <h1>${today} 待办</h1>
    <ul>${tasks.map(t => `<li>${t.title} ${t.done ? '✅' : ''}</li>`).join('')}</ul>
  `
}