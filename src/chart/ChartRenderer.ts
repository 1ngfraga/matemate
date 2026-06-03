import { Operation } from '../core/Types'
import { DayData } from './ProgressAggregator'

interface DayRect {
  x: number; y: number; w: number; h: number
  day: DayData
}

const OP_COLORS: Record<Operation, { base: string; dark: string; hi: string; label: string }> = {
  [Operation.Addition]:       { base: '#5050c0', dark: '#2020a0', hi: '#8080ff', label: '+' },
  [Operation.Subtraction]:    { base: '#8030a0', dark: '#4a165e', hi: '#c060f0', label: '−' },
  [Operation.Multiplication]: { base: '#40a060', dark: '#207050', hi: '#80d890', label: '×' },
  [Operation.Division]:       { base: '#b86a30', dark: '#904020', hi: '#f0b070', label: '÷' },
}

const OP_ORDER: Operation[] = [
  Operation.Addition,
  Operation.Subtraction,
  Operation.Multiplication,
  Operation.Division,
]

export class ChartRenderer {
  private tooltip: HTMLElement | null = null
  private dayRects: DayRect[] = []

  constructor(
    private canvas: HTMLCanvasElement,
    private tooltipHost: HTMLElement,
  ) {
    this.setupEvents()
  }

  render(days: DayData[]): void {
    const rect = this.canvas.getBoundingClientRect()
    const dpr  = window.devicePixelRatio || 1
    this.canvas.width  = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    const ctx = this.canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    this.draw(ctx, rect.width, rect.height, days)
  }

  private draw(ctx: CanvasRenderingContext2D, W: number, H: number, days: DayData[]): void {
    ctx.clearRect(0, 0, W, H)

    const PAD_L = 6, PAD_R = 6, PAD_T = 8, PAD_B = 22
    const chartW = W - PAD_L - PAD_R
    const chartH = H - PAD_T - PAD_B
    const count = days.length
    const slotW = chartW / count
    const dayW  = Math.max(18, Math.floor(slotW * 0.82))
    const dayOff = Math.floor((slotW - dayW) / 2)
    const rowGap = 4
    const boxH = Math.max(18, Math.floor((chartH - rowGap * 3) / 4))

    this.dayRects = []

    for (let i = 0; i < count; i++) {
      const day = days[i]
      const x = PAD_L + i * slotW + dayOff
      const isToday = i === count - 1

      for (let row = 0; row < OP_ORDER.length; row++) {
        const op = OP_ORDER[row]
        const data = day.byOperation[op]
        const y = PAD_T + row * (boxH + rowGap)
        const theme = OP_COLORS[op]

        if (data && data.attempts > 0) {
          ctx.fillStyle = theme.base
          ctx.fillRect(x, y, dayW, boxH)
          ctx.fillStyle = theme.hi
          ctx.fillRect(x + 2, y + 2, dayW - 4, Math.max(3, Math.floor(boxH * 0.22)))
          ctx.fillStyle = theme.dark
          ctx.fillRect(x, y + boxH - 4, dayW, 4)
          ctx.fillRect(x + dayW - 4, y, 4, boxH)
          ctx.strokeStyle = isToday ? '#f0c040' : theme.hi
          ctx.lineWidth = data.starred ? 2 : 1
          ctx.strokeRect(x + 0.5, y + 0.5, dayW - 1, boxH - 1)
        }

        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${Math.max(8, Math.floor(boxH * 0.32))}px 'Courier New', monospace`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        if (data && data.attempts > 0) ctx.fillText(theme.label, x + 4, y + 3)

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `bold ${Math.max(9, Math.floor(boxH * 0.42))}px 'Courier New', monospace`
        if (data && data.attempts > 0) ctx.fillText(String(data.attempts), x + dayW / 2, y + boxH / 2 + 1)

        if (data?.starred && data.attempts > 0) {
          ctx.fillStyle = '#f0c040'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'top'
          ctx.font = `bold ${Math.max(8, Math.floor(boxH * 0.34))}px 'Courier New', monospace`
          ctx.fillText('★', x + dayW - 4, y + 2)
        }
      }

      ctx.fillStyle = isToday ? '#f0c040' : '#5050a0'
      ctx.font = `bold ${Math.max(7, Math.floor(slotW * 0.42))}px 'Courier New', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(day.label, x + dayW / 2, H - 3)

      this.dayRects.push({ x, y: PAD_T, w: dayW, h: chartH, day })
    }
  }

  private setupEvents(): void {
    const hit = (cx: number, cy: number) => {
      const r = this.canvas.getBoundingClientRect()
      const cvsX = cx - r.left
      const cvsY = cy - r.top
      return this.dayRects.find(
        (b) => cvsX >= b.x && cvsX <= b.x + b.w && cvsY >= b.y && cvsY <= b.y + b.h,
      ) ?? null
    }

    this.canvas.addEventListener('mousemove', (e) => {
      const b = hit(e.clientX, e.clientY)
      this.showTooltip(b ? b.day : null, e.clientX, e.clientY)
    })
    this.canvas.addEventListener('mouseleave', () => this.showTooltip(null, 0, 0))
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const t = e.touches[0]
      const b = hit(t.clientX, t.clientY)
      this.showTooltip(b ? b.day : null, t.clientX, t.clientY)
    }, { passive: false })
    this.canvas.addEventListener('touchend', () => {
      setTimeout(() => this.showTooltip(null, 0, 0), 2500)
    })
  }

  private showTooltip(day: DayData | null, clientX: number, clientY: number): void {
    if (!day) {
      if (this.tooltip) this.tooltip.style.display = 'none'
      return
    }
    if (!this.tooltip) {
      this.tooltip = document.createElement('div')
      this.tooltip.className = 'chart-tooltip'
      this.tooltipHost.appendChild(this.tooltip)
    }

    const rows = OP_ORDER.map((op) => {
      const data = day.byOperation[op]
      const theme = OP_COLORS[op]
      if (!data || data.attempts <= 0) return ''
      return `<div class="tt-row"><span style="color:${theme.base}">${theme.label}</span> ${data.attempts}${data.starred ? ' ★' : ''}</div>`
    }).filter(Boolean).join('')

    if (!rows) {
      if (this.tooltip) this.tooltip.style.display = 'none'
      return
    }

    this.tooltip.innerHTML =
      `<div class="tt-date">${day.dateISO.slice(5).replace('-', '/')}</div>` +
      rows

    const host = this.tooltipHost.getBoundingClientRect()
    const TW = 110, TH = 96
    const tx = Math.max(4, Math.min(clientX - host.left - TW / 2, host.width - TW - 4))
    const ty = Math.max(4, clientY - host.top - TH - 8)

    this.tooltip.style.cssText = `
      display:block; position:absolute;
      left:${tx}px; top:${ty}px;
      background:#1a1a2e; border:2px solid #4a4a8a;
      padding:6px 10px; font-family:'Courier New',monospace;
      font-size:11px; color:#e8e8f0; pointer-events:none;
      z-index:10; white-space:nowrap;
      box-shadow: 3px 3px 0 #000;
    `
  }
}
