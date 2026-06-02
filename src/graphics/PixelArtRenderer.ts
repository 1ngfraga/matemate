import { Sprite } from './SpriteFactory'

// ── Background tiles ──────────────────────────────────────────────────────

const SKY_COLORS   = ['#050510', '#080820', '#0a0a2a']
const GROUND_COLOR  = '#1a1040'
const ROAD_COLOR    = '#2a2060'
const ROAD_STRIPE   = '#3a3080'
const ROAD_LINE     = '#f0c04044'
const HILL_COLOR    = '#120c38'

/**
 * Draw the scrolling game background:
 *   - gradient sky with stars
 *   - distant hills (parallax)
 *   - road/path strip at bottom
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  scrollX: number,
  stars: StarField,
): void {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H * 0.65)
  grad.addColorStop(0,   SKY_COLORS[0])
  grad.addColorStop(0.5, SKY_COLORS[1])
  grad.addColorStop(1,   SKY_COLORS[2])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H * 0.65)

  // Stars
  drawStars(ctx, stars, scrollX * 0.05)

  // Distant hills (slow parallax)
  drawHills(ctx, W, H, scrollX * 0.2)

  // Ground strip
  ctx.fillStyle = GROUND_COLOR
  ctx.fillRect(0, H * 0.65, W, H * 0.05)

  // Road
  const roadY = H * 0.70
  const roadH = H * 0.30
  ctx.fillStyle = ROAD_COLOR
  ctx.fillRect(0, roadY, W, roadH)

  // Road stripes (pixel-art style, scrolling)
  const stripeW = 24
  const stripeH = 4
  const stripeY  = roadY + roadH * 0.45
  const offset   = (scrollX * 0.8) % (stripeW * 2)

  for (let x = -stripeW * 2 + offset; x < W + stripeW; x += stripeW * 2) {
    ctx.fillStyle = ROAD_LINE
    ctx.fillRect(Math.round(x), Math.round(stripeY), stripeW, stripeH)
  }

  // Road edge lines
  ctx.fillStyle = ROAD_STRIPE
  ctx.fillRect(0, roadY, W, 2)
  ctx.fillRect(0, roadY + roadH - 2, W, 2)
}

// ── Hills (parallax layer) ────────────────────────────────────────────────

function drawHills(ctx: CanvasRenderingContext2D, W: number, H: number, offset: number): void {
  const baseY = H * 0.65
  ctx.fillStyle = HILL_COLOR

  // Two waves of hills with different amplitudes
  const hillData = [
    { amp: H * 0.15, freq: 0.008, phase: 0    },
    { amp: H * 0.10, freq: 0.013, phase: 2.1  },
  ]
  for (const h of hillData) {
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    for (let x = 0; x <= W; x += 2) {
      const y = baseY - Math.abs(Math.sin((x + offset) * h.freq + h.phase)) * h.amp
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.lineTo(W, baseY)
    ctx.closePath()
    ctx.fill()
  }
}

// ── Star field ────────────────────────────────────────────────────────────

export interface StarField {
  stars: Array<{ x: number; y: number; size: number; bright: number }>
}

export function buildStarField(W: number, H: number, count = 80): StarField {
  const stars = Array.from({ length: count }, () => ({
    x:      Math.random() * W,
    y:      Math.random() * H * 0.55,
    size:   Math.random() < 0.15 ? 2 : 1,
    bright: 0.3 + Math.random() * 0.7,
  }))
  return { stars }
}

function drawStars(ctx: CanvasRenderingContext2D, sf: StarField, drift: number): void {
  for (const s of sf.stars) {
    const x = ((s.x - drift % 400 + 400 * 4) % 400) / 400 * ctx.canvas.width
    ctx.fillStyle = `rgba(255,255,255,${s.bright})`
    ctx.fillRect(Math.round(x), Math.round(s.y), s.size, s.size)
  }
}

// ── Pixel border / panel ─────────────────────────────────────────────────

/**
 * Draw a chunky pixel-art style panel border.
 * Outer shadow + inner highlight to give 3D depth.
 */
export function drawPixelPanel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  bg      = '#0d0d22',
  border  = '#4a4a8a',
  shadow  = '#000000',
): void {
  const B = 4  // border thickness

  // Outer shadow
  ctx.fillStyle = shadow
  ctx.fillRect(x + B, y + B, w, h)

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(x, y, w, h)

  // Border edges
  ctx.fillStyle = border
  ctx.fillRect(x, y, w, B)          // top
  ctx.fillRect(x, y + h - B, w, B)  // bottom
  ctx.fillRect(x, y, B, h)          // left
  ctx.fillRect(x + w - B, y, B, h)  // right

  // Inner highlight (top-left) — gives retro bevel effect
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.fillRect(x + B, y + B, w - B * 2, B)
  ctx.fillRect(x + B, y + B, B, h - B * 2)
}

// ── Progress / timer bar ──────────────────────────────────────────────────

export function drawTimerBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  fraction: number,   // 0 = empty, 1 = full
  grace: boolean,
): void {
  // Track
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#1a1a3a'
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2)

  // Fill
  const fillW = Math.max(0, Math.round((w - 2) * fraction))
  if (fillW > 0) {
    const color = grace        ? '#f0c040' :
                  fraction > 0.5  ? '#40d060' :
                  fraction > 0.25 ? '#f0c040' :
                                   '#d04040'
    ctx.fillStyle = color
    ctx.fillRect(x + 1, y + 1, fillW, h - 2)

    // Shimmer highlight on top
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(x + 1, y + 1, fillW, Math.max(1, Math.floor(h * 0.3)))
  }

  // Border
  ctx.fillStyle = '#3a3a6a'
  ctx.fillRect(x, y, w, 1)
  ctx.fillRect(x, y + h - 1, w, 1)
  ctx.fillRect(x, y, 1, h)
  ctx.fillRect(x + w - 1, y, 1, h)
}

// ── Score / HUD text ──────────────────────────────────────────────────────

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font      = `bold ${size}px 'Courier New', monospace`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'

  // Shadow
  ctx.fillStyle = '#000000'
  ctx.fillText(text, x + 1, y + 1)

  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

// ── Ground shadow under animal ────────────────────────────────────────────

export function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  cx: number, groundY: number,
  w: number,
): void {
  const rx = w * 0.55
  const ry = 4
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(cx, groundY, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}
