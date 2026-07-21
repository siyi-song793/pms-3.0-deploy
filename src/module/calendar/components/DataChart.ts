/**
 * 轻量原生Canvas图表引擎，无第三方依赖
 * 绑定文档色彩语义体系，用于月度完成率趋势渲染
 */
type DayRateItem = {
  day: number
  rate: number
}

export function renderMonthlyChart(containerId: string, data: DayRateItem[]) {
  const container = document.getElementById(containerId)
  if (!container) return

  container.innerHTML = ''
  const canvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  const rect = container.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'
  container.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  const padding = { top: 20, right: 10, bottom: 30, left: 30 }
  const w = rect.width - padding.left - padding.right
  const h = rect.height - padding.top - padding.bottom

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-hint').trim() || '#999'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + h)
  ctx.lineTo(padding.left + w, padding.top + h)
  ctx.stroke()

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-hint').trim() || '#999'
  ctx.font = '10px sans-serif'
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + h - (i / 5) * h
    const val = i * 20
    ctx.fillText(`${val}%`, 5, y + 3)
    ctx.beginPath()
    ctx.setLineDash([2,2])
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + w, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (data.length === 0) {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-hint').trim() || '#999'
    ctx.textAlign = 'center'
    ctx.fillText('本月暂无任务数据', padding.left + w/2, padding.top + h/2)
    return
  }

  const colorEco = getComputedStyle(document.documentElement).getPropertyValue('--color-ecology').trim() || '#2E7D32'
  ctx.strokeStyle = colorEco
  ctx.fillStyle = colorEco + '20'
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((item, idx) => {
    const x = padding.left + (idx / (data.length - 1 || 1)) * w
    const y = padding.top + h - (item.rate / 100) * h
    if (idx === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })

  ctx.lineTo(padding.left + w, padding.top + h)
  ctx.lineTo(padding.left, padding.top + h)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = colorEco
  data.forEach((item, idx) => {
    const x = padding.left + (idx / (data.length - 1 || 1)) * w
    const y = padding.top + h - (item.rate / 100) * h
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}