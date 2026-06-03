// Chrome-Dino-style background: dark sky + earthy scrolling ground.
// Ground texture is synchronized with the run-cycle scroll passed in.

export interface StarField {
  stars: Array<{ x: number; y: number; size: number; bright: number }>
}

export function buildStarField(W: number, H: number, count = 70): StarField {
  return {
    stars: Array.from({ length: count }, () => ({
      x:      Math.random() * W,
      y:      Math.random() * H * 0.55,
      size:   Math.random() < 0.12 ? 2 : 1,
      bright: 0.3 + Math.random() * 0.7,
    })),
  }
}

// ── Main background draw ──────────────────────────────────────────────────

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  scrollX: number,       // synchronized with run cycle
  sf: StarField,
): void {
  const groundY = H * 0.68    // ground surface line (Chrome-dino style, high in frame)

  // ── Sky (dark, starry) ──
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY)
  skyGrad.addColorStop(0,   '#030316')
  skyGrad.addColorStop(0.6, '#0a0a28')
  skyGrad.addColorStop(1,   '#141428')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, W, groundY)

  drawStars(ctx, sf, scrollX * 0.018)

  // Distant mesas/silhouettes (very subtle, slow parallax)
  drawSilhouettes(ctx, W, groundY, scrollX * 0.08)

  // ── Ground (earthy, textured, scrolling) ──
  // Main ground fill
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, H)
  groundGrad.addColorStop(0,   '#c47820')  // warm top
  groundGrad.addColorStop(0.1, '#9a5810')  // main earth
  groundGrad.addColorStop(0.7, '#7a4008')  // deeper
  groundGrad.addColorStop(1,   '#4a2004')  // very bottom
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, groundY, W, H - groundY)

  // Ground surface line — the critical Chrome-dino element
  ctx.fillStyle = '#e8a030'  // warm bright strip
  ctx.fillRect(0, groundY,     W, 2)
  ctx.fillStyle = '#fff0c0'  // highlight line at very top
  ctx.fillRect(0, groundY,     W, 1)
  ctx.fillStyle = '#8a4808'  // shadow line just below surface
  ctx.fillRect(0, groundY + 2, W, 2)

  // Ground texture: rocks/pebbles scrolling
  drawGroundTexture(ctx, W, H, groundY, scrollX)
}

// ── Silhouettes (distant mesas) ───────────────────────────────────────────

function drawSilhouettes(ctx: CanvasRenderingContext2D, W: number, groundY: number, offset: number) {
  ctx.fillStyle = '#0c0c26'   // barely darker than sky
  const PERIOD = 680
  const shapes = [
    { rx: 30,  w: 90,  h: 28 },
    { rx: 170, w: 60,  h: 18 },
    { rx: 270, w: 110, h: 38 },
    { rx: 420, w: 75,  h: 24 },
    { rx: 560, w: 95,  h: 32 },
  ]
  for (const sh of shapes) {
    for (let rep = -1; rep <= Math.ceil(W / PERIOD) + 1; rep++) {
      const sx = ((sh.rx - offset % PERIOD + rep * PERIOD) % PERIOD + PERIOD) % PERIOD
      if (sx > W + sh.w || sx < -sh.w) continue
      // Mesa: flat top with slight taper
      ctx.fillRect(sx, groundY - sh.h, sh.w, sh.h)
      ctx.fillRect(sx + 6, groundY - sh.h - 8, sh.w - 12, 8)  // mesa cap
    }
  }
}

// ── Ground texture (rocks + dirt) ────────────────────────────────────────

const STONE_PERIOD = 320   // pixels before pattern repeats

// Static stone layout — deterministic, no Math.random at draw time
const STONES: Array<{ rx: number; ry: number; w: number; h: number; c: string; hi: string }> = [
  { rx: 18,  ry: 6,  w: 8,  h: 4, c: '#6a3808', hi: '#9a5820' },
  { rx: 55,  ry: 14, w: 5,  h: 3, c: '#7a4810', hi: '#aa6828' },
  { rx: 90,  ry: 4,  w: 10, h: 5, c: '#5a2804', hi: '#8a4810' },
  { rx: 140, ry: 18, w: 4,  h: 3, c: '#6a3808', hi: '#9a5820' },
  { rx: 175, ry: 8,  w: 6,  h: 3, c: '#8a5828', hi: '#ba8840' },
  { rx: 210, ry: 5,  w: 9,  h: 4, c: '#5a2804', hi: '#7a4010' },
  { rx: 255, ry: 20, w: 5,  h: 3, c: '#6a3808', hi: '#9a5820' },
  { rx: 290, ry: 10, w: 7,  h: 4, c: '#7a4810', hi: '#aa6828' },
  // Tiny pebbles
  { rx: 38,  ry: 22, w: 3,  h: 2, c: '#8a5828', hi: '#aa6830' },
  { rx: 72,  ry: 28, w: 2,  h: 2, c: '#6a3808', hi: '#8a5010' },
  { rx: 112, ry: 25, w: 3,  h: 2, c: '#7a4810', hi: '#9a6020' },
  { rx: 160, ry: 32, w: 2,  h: 2, c: '#5a2804', hi: '#7a3808' },
  { rx: 198, ry: 24, w: 3,  h: 2, c: '#8a5828', hi: '#aa6830' },
  { rx: 238, ry: 30, w: 2,  h: 2, c: '#6a3808', hi: '#8a5010' },
  { rx: 275, ry: 22, w: 3,  h: 2, c: '#7a4810', hi: '#9a6020' },
  { rx: 310, ry: 28, w: 2,  h: 2, c: '#5a2804', hi: '#7a3808' },
]

function drawGroundTexture(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundY: number,
  scrollX: number,
) {
  const maxY = H - groundY - 4   // don't draw stones below very bottom

  for (const st of STONES) {
    if (st.ry > maxY) continue

    // Draw stone in every visible tile of the period
    for (let rep = -1; rep <= Math.ceil(W / STONE_PERIOD) + 1; rep++) {
      const sx = ((st.rx - scrollX % STONE_PERIOD + rep * STONE_PERIOD) % STONE_PERIOD + STONE_PERIOD) % STONE_PERIOD
      if (sx > W + st.w || sx < -st.w) continue
      const sy = groundY + st.ry + 3

      ctx.fillStyle = st.c
      ctx.fillRect(sx, sy, st.w, st.h)
      ctx.fillStyle = st.hi   // top highlight
      ctx.fillRect(sx, sy, st.w, 1)
      ctx.fillStyle = '#3a1800'   // bottom shadow
      ctx.fillRect(sx, sy + st.h - 1, st.w, 1)
    }
  }
}

// ── Stars ─────────────────────────────────────────────────────────────────

function drawStars(ctx: CanvasRenderingContext2D, sf: StarField, drift: number) {
  const W = ctx.canvas.width / (window.devicePixelRatio || 1)
  for (const s of sf.stars) {
    const x = ((s.x - drift % W + W * 4) % W)
    ctx.fillStyle = `rgba(255,255,255,${s.bright})`
    ctx.fillRect(Math.round(x), Math.round(s.y), s.size, s.size)
  }
}

// ── HUD utilities (used by GameScreen) ───────────────────────────────────

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font = `bold ${size}px 'Courier New', monospace`
  ctx.textAlign = align; ctx.textBaseline = 'top'
  ctx.fillStyle = '#000'; ctx.fillText(text, x + 1, y + 1)  // shadow
  ctx.fillStyle = color;  ctx.fillText(text, x, y)
}

export function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  cx: number, groundY: number, w: number,
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.30)'
  ctx.beginPath()
  ctx.ellipse(cx, groundY + 2, w * 0.45, 3, 0, 0, Math.PI * 2)
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
    const color = grace ? '#f0c040' : fraction > 0.5 ? '#40d060' : fraction > 0.25 ? '#f0c040' : '#d04040'
    ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, fw, h - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 1, y + 1, fw, Math.max(1, Math.floor(h * 0.3)))
  }
  ctx.fillStyle = '#3a3a6a'
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1)
  ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h)
}
