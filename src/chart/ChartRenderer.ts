import { DayData } from './ProgressAggregator'

interface BarRect {
  x: number; y: number; w: number; h: number
  day: DayData
}

export class ChartRenderer {
  private tooltip: HTMLElement | null = null
  private barRects: BarRect[] = []
  private days: DayData[] = []

  constructor(
    private canvas: HTMLCanvasElement,
    private tooltipHost: HTMLElement,
  ) {
    this.setupEvents()
  }

  render(days: DayData[]): void {
    this.days = days
    // Match canvas buffer to displayed size to avoid blur
    const rect = this.canvas.getBoundingClientRect()
    const dpr  = window.devicePixelRatio || 1
    this.canvas.width  = Math.round(rect.width  * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    const ctx = this.canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    this.draw(ctx, rect.width, rect.height)
  }

  private draw(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.clearRect(0, 0, W, H)

    const PAD_L = 6, PAD_R = 6, PAD_T = 8, PAD_B = 22
    const chartW = W - PAD_L - PAD_R
    const chartH = H - PAD_T - PAD_B
    const count  = this.days.length

    // Background grid
    ctx.strokeStyle = '#1e1e3e'
    ctx.lineWidth   = 1
    for (const pct of [25, 50, 75, 100]) {
      const gy = PAD_T + chartH - (pct / 100) * chartH
      ctx.beginPath(); ctx.moveTo(PAD_L, gy); ctx.lineTo(W - PAD_R, gy); ctx.stroke()
    }

    // Axis line
    ctx.strokeStyle = '#3a3a6a'
    ctx.lineWidth   = 2
    ctx.beginPath()
    ctx.moveTo(PAD_L, PAD_T + chartH)
    ctx.lineTo(W - PAD_R, PAD_T + chartH)
    ctx.stroke()

    const barSlot  = chartW / count
    const barW     = Math.max(2, Math.floor(barSlot * 0.72))
    const barOff   = Math.floor((barSlot - barW) / 2)
    const labelFs  = Math.max(7, Math.floor(barSlot * 0.42))

    this.barRects = []

    for (let i = 0; i < count; i++) {
      const day = this.days[i]
      const bx  = PAD_L + i * barSlot + barOff
      const isToday = i === count - 1

      // Label
      ctx.fillStyle  = isToday ? '#f0c040' : '#5050a0'
      ctx.font       = `bold ${labelFs}px 'Courier New', monospace`
      ctx.textAlign  = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(day.label, bx + barW / 2, H - 3)

      if (day.percentCorrect === null) {
        // No data — thin placeholder
        ctx.fillStyle = '#1a1a3a'
        ctx.fillRect(bx, PAD_T + chartH - 4, barW, 4)
        continue
      }

      const pct  = day.percentCorrect
      const bh   = Math.max(4, Math.floor((pct / 100) * chartH))
      const by   = PAD_T + chartH - bh

      const [base, dark, hi] =
        pct >= 80 ? ['#40d060', '#1a6030', '#80ff90'] :
        pct >= 50 ? ['#f0c040', '#806010', '#ffe880'] :
                    ['#d04040', '#701818', '#ff8888']

      // Bar body
      ctx.fillStyle = base
      ctx.fillRect(bx, by, barW, bh)

      // Pixel depth shadow (right + bottom)
      const sw = Math.max(1, Math.floor(barW * 0.18))
      ctx.fillStyle = dark
      ctx.fillRect(bx + barW - sw, by, sw, bh)
      ctx.fillRect(bx, by + bh - sw, barW, sw)

      // Highlight top edge
      ctx.fillStyle = hi
      ctx.fillRect(bx, by, barW, Math.max(1, Math.floor(bh * 0.06) + 1))

      // Today indicator — small dot above bar
      if (isToday) {
        ctx.fillStyle = '#f0c040'
        const dotS = Math.max(3, Math.floor(barW * 0.3))
        ctx.fillRect(bx + Math.floor((barW - dotS) / 2), by - dotS - 2, dotS, dotS)
      }

      this.barRects.push({ x: bx, y: by, w: barW, h: bh, day })
    }
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────

  private setupEvents(): void {
    const hit = (cx: number, cy: number) => {
      const r     = this.canvas.getBoundingClientRect()
      const dpr   = window.devicePixelRatio || 1
      const cvsX  = (cx - r.left)
      const cvsY  = (cy - r.top)
      // barRects are in CSS-pixel coordinates (we drew after dividing by dpr)
      return this.barRects.find(
        b => cvsX >= b.x && cvsX <= b.x + b.w && cvsY >= b.y && cvsY <= b.y + b.h,
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

    const mmdd    = day.dateISO.slice(5).replace('-', '/')
    const pctStr  = day.percentCorrect !== null ? `${day.percentCorrect}%` : 'sin datos'
    const games   = day.gameCount > 1
      ? `${day.gameCount} partidas`
      : day.gameCount === 1 ? '1 partida' : ''

    this.tooltip.innerHTML =
      `<div class="tt-date">${mmdd}</div>` +
      `<div class="tt-pct">${pctStr}</div>` +
      (games ? `<div class="tt-games">${games}</div>` : '')

    const host = this.tooltipHost.getBoundingClientRect()
    const TW = 80, TH = 56
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
