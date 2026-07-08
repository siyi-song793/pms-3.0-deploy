export function renderTimeline() {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div class="tab-nav">
      <a href="javascript:go('/')">今日</a>
      <a href="javascript:go('/timeline')" class="active">时间轴</a>
      <a href="javascript:go('/calendar')">月历</a>
    </div>
    <h1>时间轴</h1>
    <p>记录你的每一天</p>
  `
}