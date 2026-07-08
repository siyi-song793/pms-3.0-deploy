export function renderCalendar() {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div class="tab-nav">
      <a href="javascript:go('/')">今日</a>
      <a href="javascript:go('/timeline')">时间轴</a>
      <a href="javascript:go('/calendar')" class="active">月历</a>
    </div>
    <h1>月历视图</h1>
  `
}