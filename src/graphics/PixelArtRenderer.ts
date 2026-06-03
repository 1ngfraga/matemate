// Colorful, child-friendly background inspired by the reference images.
// Bright blue sky, white clouds, green rolling hills, flowers and pebbles.

export interface StarField {
  stars: Array<{ x: number; y: number; size: number; bright: number }>
}

export function buildStarField(_W: number, _H: number, _count = 30): StarField {
  // Kept for API compatibility — sky is now bright so fewer/no stars
  return { stars: [] }
}

// Ground surface fraction — where the green ground starts
export const GROUND_FRAC = 0.66

// ── Main draw ─────────────────────────────────────────────────────────────

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  scrollX: number,
  _sf: StarField,
): void {
  const groundY = H * GROUND_FRAC

  // ── Sky — bright blue gradient ──
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY)
  skyGrad.addColorStop(0,   '#2288dd')
  skyGrad.addColorStop(0.5, '#44aaee')
  skyGrad.addColorStop(1,   '#88ccff')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, W, groundY + 2)

  // ── Sun (top-right area) ──
  drawSun(ctx, W * 0.85, H * 0.08, H * 0.07)

  // ── Clouds ──
  drawClouds(ctx, W, H, scrollX * 0.04)

  // ── Distant hills (bright green) ──
  drawHills(ctx, W, H, groundY, scrollX * 0.12)

  // ── Ground base (bright green grass) ──
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, H)
  groundGrad.addColorStop(0,   '#48cc48')   // bright grass top
  groundGrad.addColorStop(0.15,'#38b038')   // main grass
  groundGrad.addColorStop(0.6, '#289028')   // deeper green
  groundGrad.addColorStop(1,   '#1a6018')   // very bottom
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, groundY, W, H - groundY)

  // ── Ground edge (bright line) ──
  ctx.fillStyle = '#70e870'
  ctx.fillRect(0, groundY, W, 3)
  ctx.fillStyle = '#58d458'
  ctx.fillRect(0, groundY + 3, W, 2)

  // ── Ground details: flowers + pebbles ──
  drawGroundDetails(ctx, W, H, groundY, scrollX)
}

// ── Sun ───────────────────────────────────────────────────────────────────

function drawSun(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.5)
  glow.addColorStop(0,   'rgba(255,240,100,0.6)')
  glow.addColorStop(0.5, 'rgba(255,220,50,0.15)')
  glow.addColorStop(1,   'rgba(255,200,0,0)')
  ctx.fillStyle = glow
  ctx.beginPath(); ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2); ctx.fill()

  // Sun disk
  ctx.fillStyle = '#ffee44'
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffffa0'
  ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.5, 0, Math.PI * 2); ctx.fill()

  // Pixel-art rays
  ctx.fillStyle = '#ffee44'
  const rays = 8
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2
    const x1 = cx + Math.cos(angle) * r * 1.3
    const y1 = cy + Math.sin(angle) * r * 1.3
    const rw  = Math.max(2, r * 0.15)
    ctx.fillRect(x1 - rw / 2, y1 - rw / 2, rw, rw * 2.5)
  }
}

// ── Clouds ────────────────────────────────────────────────────────────────

const CLOUD_DEFS = [
  { rx: 50,  ry: 0.08, w: 120, h: 40 },
  { rx: 240, ry: 0.05, w: 90,  h: 32 },
  { rx: 420, ry: 0.12, w: 150, h: 48 },
  { rx: 620, ry: 0.06, w: 100, h: 36 },
  { rx: 800, ry: 0.10, w: 130, h: 42 },
]

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  // Shadow
  ctx.fillStyle = '#c8e8ff'
  ctx.beginPath(); ctx.ellipse(cx + w * 0.1, cy + h * 0.3, w * 0.45, h * 0.38, 0, 0, Math.PI * 2); ctx.fill()

  // Main cloud body (3 overlapping circles for fluffy look)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx - w * 0.28, cy + h * 0.1, w * 0.35, h * 0.38, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + w * 0.3, cy + h * 0.08, w * 0.38, h * 0.42, 0, 0, Math.PI * 2); ctx.fill()
  // Top puff
  ctx.beginPath(); ctx.ellipse(cx - w * 0.08, cy - h * 0.18, w * 0.28, h * 0.32, 0, 0, Math.PI * 2); ctx.fill()
}

function drawClouds(ctx: CanvasRenderingContext2D, W: number, H: number, drift: number) {
  const PERIOD = 900
  for (const cl of CLOUD_DEFS) {
    for (let rep = -1; rep <= Math.ceil(W / PERIOD) + 1; rep++) {
      const cx = ((cl.rx - drift % PERIOD + rep * PERIOD) % PERIOD + PERIOD) % PERIOD
      if (cx > W + cl.w || cx < -cl.w) continue
      drawCloud(ctx, cx, H * cl.ry + cl.h / 2, cl.w, cl.h)
    }
  }
}

// ── Distant hills ─────────────────────────────────────────────────────────

function drawHills(
  ctx: CanvasRenderingContext2D,
  W: number, H: number, groundY: number, offset: number,
) {
  const hillY = groundY * 0.78
  // Far hills (lighter)
  ctx.fillStyle = '#60c860'
  const PERIOD_F = 600
  for (let rep = -1; rep <= Math.ceil(W / PERIOD_F) + 1; rep++) {
    const shapes = [
      { rx: 80,  amp: 0.12 },
      { rx: 240, amp: 0.09 },
      { rx: 400, amp: 0.14 },
    ]
    for (const sh of shapes) {
      const cx = ((sh.rx - offset % PERIOD_F + rep * PERIOD_F) % PERIOD_F + PERIOD_F) % PERIOD_F
      const ht = H * sh.amp
      ctx.beginPath()
      ctx.ellipse(cx, hillY + ht * 0.3, H * sh.amp * 1.8, ht, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Near hills (darker, with tree silhouettes)
  ctx.fillStyle = '#48b848'
  const PERIOD_N = 500
  const shapes2 = [{ rx: 120, amp: 0.10 }, { rx: 300, amp: 0.13 }, { rx: 460, amp: 0.08 }]
  for (let rep = -1; rep <= Math.ceil(W / PERIOD_N) + 1; rep++) {
    for (const sh of shapes2) {
      const cx = ((sh.rx - offset * 1.4 % PERIOD_N + rep * PERIOD_N) % PERIOD_N + PERIOD_N) % PERIOD_N
      if (cx < -200 || cx > W + 200) continue
      const ht = H * sh.amp
      ctx.beginPath()
      ctx.ellipse(cx, groundY + 4, H * sh.amp * 2.2, ht, 0, 0, Math.PI * 2)
      ctx.fill()

      // Simple pixel tree silhouettes on top of hills
      drawTree(ctx, cx - 50, groundY - ht * 0.6, ht * 1.2)
      drawTree(ctx, cx + 60, groundY - ht * 0.5, ht * 1.0)
    }
  }
}

function drawTree(ctx: CanvasRenderingContext2D, cx: number, baseY: number, h: number) {
  const trunkH = h * 0.3
  const crownR = h * 0.45
  // Trunk
  ctx.fillStyle = '#8a5020'
  ctx.fillRect(cx - h * 0.06, baseY - trunkH, h * 0.12, trunkH)
  // Crown (2 layers for palm/tropical look)
  ctx.fillStyle = '#1a8020'
  ctx.beginPath(); ctx.arc(cx, baseY - trunkH - crownR * 0.6, crownR, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#28a830'
  ctx.beginPath(); ctx.arc(cx - crownR * 0.2, baseY - trunkH - crownR * 0.9, crownR * 0.7, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + crownR * 0.3, baseY - trunkH - crownR * 0.7, crownR * 0.65, 0, Math.PI * 2); ctx.fill()
}

// ── Ground details: flowers + pebbles ────────────────────────────────────

const DETAIL_PERIOD = 400

// Pre-defined deterministic layout
const FLOWERS: Array<{ rx: number; ry: number; color: string; size: number }> = [
  { rx: 18,  ry: 4,  color: '#ff88aa', size: 3 },
  { rx: 35,  ry: 12, color: '#ffffff', size: 2 },
  { rx: 62,  ry: 6,  color: '#ffee44', size: 3 },
  { rx: 88,  ry: 14, color: '#ff88aa', size: 2 },
  { rx: 105, ry: 8,  color: '#ff66cc', size: 3 },
  { rx: 130, ry: 18, color: '#ffffff', size: 2 },
  { rx: 152, ry: 5,  color: '#ffee44', size: 3 },
  { rx: 175, ry: 10, color: '#ff88aa', size: 3 },
  { rx: 198, ry: 16, color: '#ff66cc', size: 2 },
  { rx: 220, ry: 6,  color: '#ffffff', size: 3 },
  { rx: 245, ry: 12, color: '#ffee44', size: 2 },
  { rx: 268, ry: 4,  color: '#ff88aa', size: 3 },
  { rx: 290, ry: 18, color: '#ff66cc', size: 2 },
  { rx: 315, ry: 8,  color: '#ffffff', size: 3 },
  { rx: 338, ry: 14, color: '#ffee44', size: 3 },
  { rx: 362, ry: 5,  color: '#ff88aa', size: 2 },
  { rx: 385, ry: 10, color: '#ff66cc', size: 3 },
]

const PEBBLES: Array<{ rx: number; ry: number; w: number; h: number }> = [
  { rx: 48,  ry: 20, w: 6, h: 4 },
  { rx: 120, ry: 24, w: 8, h: 5 },
  { rx: 210, ry: 22, w: 5, h: 4 },
  { rx: 300, ry: 26, w: 7, h: 5 },
  { rx: 350, ry: 20, w: 5, h: 3 },
]

function drawGroundDetails(
  ctx: CanvasRenderingContext2D,
  W: number, H: number, groundY: number,
  scrollX: number,
) {
  const maxY = H - groundY - 2

  // Flowers
  for (const fl of FLOWERS) {
    if (fl.ry > maxY) continue
    for (let rep = -1; rep <= Math.ceil(W / DETAIL_PERIOD) + 1; rep++) {
      const fx = ((fl.rx - scrollX % DETAIL_PERIOD + rep * DETAIL_PERIOD) % DETAIL_PERIOD + DETAIL_PERIOD) % DETAIL_PERIOD
      if (fx < -10 || fx > W + 10) continue
      const fy = groundY + fl.ry

      // Flower: petals around center
      ctx.fillStyle = fl.color
      ctx.fillRect(fx - fl.size, fy - fl.size, fl.size * 2 + 1, 1)       // horizontal petal
      ctx.fillRect(fx, fy - fl.size, 1, fl.size * 2 + 1)                 // vertical petal
      // Center
      ctx.fillStyle = '#ffee44'
      ctx.fillRect(fx - 1, fy - 1, 3, 3)
      // Stem
      ctx.fillStyle = '#38b038'
      ctx.fillRect(fx, fy + fl.size, 1, 3)
    }
  }

  // Pebbles / small rocks
  for (const pb of PEBBLES) {
    if (pb.ry > maxY) continue
    for (let rep = -1; rep <= Math.ceil(W / DETAIL_PERIOD) + 1; rep++) {
      const px = ((pb.rx - scrollX % DETAIL_PERIOD + rep * DETAIL_PERIOD) % DETAIL_PERIOD + DETAIL_PERIOD) % DETAIL_PERIOD
      if (px < -pb.w || px > W + pb.w) continue
      const py = groundY + pb.ry

      ctx.fillStyle = '#b0b090'
      ctx.fillRect(px, py, pb.w, pb.h)
      ctx.fillStyle = '#d0d0b0'   // highlight
      ctx.fillRect(px, py, pb.w, 1)
      ctx.fillStyle = '#808070'   // shadow
      ctx.fillRect(px, py + pb.h - 1, pb.w, 1)
    }
  }
}

// ── HUD utilities ─────────────────────────────────────────────────────────

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font = `bold ${size}px 'Courier New', monospace`
  ctx.textAlign = align; ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillText(text, x + 1, y + 1)
  ctx.fillStyle = color; ctx.fillText(text, x, y)
}

export function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  cx: number, groundY: number, w: number,
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.ellipse(cx, groundY + 2, w * 0.42, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

export function drawTimerBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fraction: number, grace: boolean,
): void {
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#1a1a3a'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2)
  const fw = Math.max(0, Math.round((w - 2) * fraction))
  if (fw > 0) {
    const col = grace ? '#f0c040' : fraction > 0.5 ? '#40d060' : fraction > 0.25 ? '#f0c040' : '#d04040'
    ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, fw, h - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fillRect(x + 1, y + 1, fw, Math.max(1, Math.floor(h * 0.3)))
  }
  ctx.fillStyle = '#3a3a6a'
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1)
  ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h)
}
