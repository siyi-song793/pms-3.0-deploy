export function renderChart(container: HTMLElement, data: number[]) {
  container.innerText = '图表：' + data.join(', ')
}