// Colorful, child-friendly background.
// Plants and ground surface use PNG sprite sheets from public/sprites/.

import { loadSprite } from './SpriteLoader'

// Individual plant sprites (all same size: 507×246, transparent-padded)
const plantImgs: HTMLImageElement[] = [0,1,2,3,4,5,6,7].map(i => loadSprite(`sprites/plant_${i}.png`))
// 3 ground tile variants (all same size: 551×542) — randomly connected
const groundTiles: HTMLImageElement[] = [0,1,2].map(i => loadSprite(`sprites/ground_${i}.png`))
const sunImg     = loadSprite('sprites/sun.png')
const cloudImgs  = [
  loadSprite('sprites/cloud_a.png'),
  loadSprite('sprites/cloud_b.png'),
  loadSprite('sprites/cloud_c.png'),
]

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
  drawPngSun(ctx, W * 0.85, H * 0.1, H * 0.14)

  // ── Clouds ──
  drawPngClouds(ctx, W, H, scrollX * 0.04)

  // ── Distant hills (bright green) ──
  drawHills(ctx, W, H, groundY, scrollX * 0.12)

  // ── Ground base: tiled PNG or fallback gradient ──
  drawGroundSurface(ctx, W, H, groundY, scrollX)

  // ── Ground edge (bright line) ──
  ctx.fillStyle = '#70e870'
  ctx.fillRect(0, groundY, W, 3)
  ctx.fillStyle = '#58d458'
  ctx.fillRect(0, groundY + 3, W, 2)

  // ── Ground plants (PNG) or fallback flowers ──
  drawGroundPlants(ctx, W, H, groundY, scrollX)
}

// ── Sun (PNG) ─────────────────────────────────────────────────────────────

function drawPngSun(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  if (sunImg.complete && sunImg.naturalWidth > 0) {
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(sunImg, cx - size / 2, cy - size / 2, size, size)
    ctx.restore()
  } else {
    // Fallback while loading
    ctx.fillStyle = '#ffee44'
    ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, Math.PI * 2); ctx.fill()
  }
}

// ── Clouds (PNG) ──────────────────────────────────────────────────────────

// 5 cloud positions, cycling through the 3 cloud variants, drifting slowly
const CLOUD_DEFS = [
  { rx: 60,   ry: 0.07, wFrac: 0.18, ci: 0 },
  { rx: 260,  ry: 0.04, wFrac: 0.14, ci: 1 },
  { rx: 460,  ry: 0.10, wFrac: 0.22, ci: 2 },
  { rx: 650,  ry: 0.05, wFrac: 0.16, ci: 0 },
  { rx: 840,  ry: 0.09, wFrac: 0.20, ci: 1 },
]

function drawPngClouds(ctx: CanvasRenderingContext2D, W: number, H: number, drift: number) {
  const PERIOD = 900
  ctx.save()
  ctx.imageSmoothingEnabled = false
  for (const cl of CLOUD_DEFS) {
    const img = cloudImgs[cl.ci]
    if (!img.complete || img.naturalWidth === 0) continue
    const dw   = W * cl.wFrac
    const dh   = dw * (img.naturalHeight / img.naturalWidth)
    const cy   = H * cl.ry
    const base = ((cl.rx - drift) % PERIOD + PERIOD) % PERIOD
    for (let rep = -1; rep <= Math.ceil(W / PERIOD) + 1; rep++) {
      const cx = base + rep * PERIOD
      if (cx > W + dw || cx < -dw) continue
      ctx.drawImage(img, cx - dw / 2, cy, dw, dh)
    }
  }
  ctx.restore()
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
  const farShapes = [
    { rx: 80,  amp: 0.12 },
    { rx: 240, amp: 0.09 },
    { rx: 400, amp: 0.14 },
  ]
  for (const sh of farShapes) {
    const base = ((sh.rx - offset) % PERIOD_F + PERIOD_F) % PERIOD_F
    for (let rep = -1; rep <= Math.ceil(W / PERIOD_F) + 1; rep++) {
      const cx = base + rep * PERIOD_F
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
  for (const sh of shapes2) {
    const nearOffset = offset * 1.4
    const base = ((sh.rx - nearOffset) % PERIOD_N + PERIOD_N) % PERIOD_N
    for (let rep = -1; rep <= Math.ceil(W / PERIOD_N) + 1; rep++) {
      const cx = base + rep * PERIOD_N
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

// ── Ground surface (PNG tiles or gradient fallback) ───────────────────────────

const TILE_PERIOD = 400   // px before tiles repeat

// Deterministic tile-variant picker: same tile position always gets same variant,
// but adjacent tiles look different. No flickering during scroll.
function groundVariant(tileIdx: number): number {
  return (Math.imul(tileIdx, 2654435761) >>> 0) % 3
}

function drawGroundSurface(
  ctx: CanvasRenderingContext2D,
  W: number, H: number, groundY: number,
  scrollX: number,
) {
  const ref = groundTiles[0]
  if (!ref.complete || ref.naturalWidth === 0) {
    // Fallback gradient while tiles load
    const g = ctx.createLinearGradient(0, groundY, 0, H)
    g.addColorStop(0,    '#48cc48')
    g.addColorStop(0.15, '#38b038')
    g.addColorStop(0.6,  '#289028')
    g.addColorStop(1,    '#1a6018')
    ctx.fillStyle = g
    ctx.fillRect(0, groundY, W, H - groundY)
    return
  }

  // Square tiles — scale to fill the ground strip height
  const dh = H - groundY
  const dw = Math.round(dh * ref.naturalWidth / ref.naturalHeight)

  const startTile = Math.floor(scrollX / dw)
  const offset    = scrollX % dw

  ctx.save()
  ctx.imageSmoothingEnabled = false

  for (let i = -1; i <= Math.ceil(W / dw) + 1; i++) {
    const v   = groundVariant(startTile + i)
    const img = groundTiles[v]
    if (!img.complete || img.naturalWidth === 0) continue
    ctx.drawImage(
      img, 0, 0, img.naturalWidth, img.naturalHeight,
      Math.round(i * dw - offset), groundY, dw, dh,
    )
  }

  ctx.restore()
}

// ── Ground plants (PNG sprite sheet) ─────────────────────────────────────────
//
// plants.png has 8 varieties in a 4×2 grid.
// Scatter them along the ground using a deterministic layout.

// rx: position within TILE_PERIOD, ry: pixels below groundY, plant: which of 8 plants
const PLANT_LAYOUT: Array<{ rx: number; ry: number; plant: number }> = [
  { rx: 15,  ry: 0, plant: 0 },
  { rx: 60,  ry: 2, plant: 3 },
  { rx: 100, ry: 0, plant: 6 },
  { rx: 145, ry: 1, plant: 1 },
  { rx: 190, ry: 0, plant: 4 },
  { rx: 230, ry: 2, plant: 7 },
  { rx: 270, ry: 0, plant: 2 },
  { rx: 315, ry: 1, plant: 5 },
  { rx: 355, ry: 0, plant: 0 },
]

function drawGroundPlants(
  ctx: CanvasRenderingContext2D,
  W: number, H: number, groundY: number,
  scrollX: number,
) {
  // All plant images share the same canvas size (507×246), so aspect ratio is identical
  const ref = plantImgs[0]
  if (!ref.complete || ref.naturalWidth === 0) {
    // Fallback dots while images load
    ctx.fillStyle = '#ffee44'
    for (let x = 20; x < W; x += 45) ctx.fillRect(x, groundY + 2, 3, 3)
    return
  }

  const aspect = ref.naturalWidth / ref.naturalHeight   // same for all plants
  const dh = Math.max(16, Math.round(H * 0.18))
  const dw = Math.round(dh * aspect)

  ctx.save()
  ctx.imageSmoothingEnabled = false

  for (const pl of PLANT_LAYOUT) {
    const img = plantImgs[pl.plant]
    if (!img.complete || img.naturalWidth === 0) continue
    const base = ((pl.rx - scrollX) % TILE_PERIOD + TILE_PERIOD) % TILE_PERIOD
    for (let rep = -1; rep <= Math.ceil(W / TILE_PERIOD) + 1; rep++) {
      const px = base + rep * TILE_PERIOD
      if (px < -dw || px > W + dw) continue
      ctx.drawImage(img, Math.round(px - dw / 2), groundY + pl.ry - dh, dw, dh)
    }
  }

  ctx.restore()
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
