import { Screen, Animal } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'
import { requestFullscreen } from '../core/Fullscreen'
import { getAnimalGameSheet } from '../graphics/GameSprites'

const OPOS_FRAME = getAnimalGameSheet(Animal.Opossum).frames[0]
const DINO_FRAME = getAnimalGameSheet(Animal.Dinosaur).frames[0]
const CAPI_FRAME = getAnimalGameSheet(Animal.Capybara).frames[0]

export class WelcomeScreen implements BaseScreen {
  private container: HTMLElement | null = null
  private raf: number | null = null
  private frame = 0

  constructor(private navigate: NavigateFn) {}

  mount(container: HTMLElement): void {
    this.container = container
    container.innerHTML = this.html()
    this.attachEvents(container)
    this.startAnimation(container)
  }

  unmount(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf)
    this.raf = null
    if (this.container) this.container.innerHTML = ''
    this.container = null
  }

  // ── HTML ─────────────────────────────────────────────────────────────────

  private html(): string {
    return `
      <div class="wl-root">
        <!-- Background canvas: colorful tropical scene -->
        <canvas id="wlBg" class="wl-bg"></canvas>

        <div class="wl-center">
          <div class="wl-title">
            <span class="wl-t1">MATE</span><span class="wl-t2">MATE</span>
          </div>
          <p class="wl-sub">¡Practica matemáticas!</p>
          <button class="btn btn--accent wl-play" id="wlPlay">▶ &nbsp;JUGAR</button>
          <p class="wl-hint" id="wlHint"></p>
        </div>
      </div>

      <style>
        .wl-root {
          width:100%; height:100%;
          position:relative; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
        }
        .wl-bg {
          position:absolute; inset:0; width:100%; height:100%;
          image-rendering:pixelated;
        }
        .wl-center {
          position:relative; z-index:2;
          display:flex; flex-direction:column; align-items:center;
          gap:clamp(10px,2vh,18px); padding:16px;
        }
        .wl-title {
          display:flex; gap:2px;
          filter:drop-shadow(0 3px 8px rgba(0,0,0,0.4));
        }
        .wl-t1 {
          font-family:'Courier New',monospace; font-weight:900;
          font-size:clamp(36px,8vw,80px); color:#ffee44;
          text-shadow:3px 3px 0 #cc8800, 5px 5px 0 #884400;
          animation:wlBounce 0.5s ease both;
          letter-spacing:2px;
        }
        .wl-t2 {
          font-family:'Courier New',monospace; font-weight:900;
          font-size:clamp(36px,8vw,80px); color:#ff8844;
          text-shadow:3px 3px 0 #cc4400, 5px 5px 0 #882200;
          animation:wlBounce 0.5s ease 0.15s both;
          letter-spacing:2px;
        }
        @keyframes wlBounce {
          from { opacity:0; transform:translateY(-30px) scale(0.6); }
          70%  { transform:translateY(4px) scale(1.05); }
          to   { opacity:1; transform:none; }
        }
        .wl-sub {
          font-family:'Courier New',monospace; font-size:clamp(13px,2.5vw,20px);
          color:#fff; letter-spacing:2px;
          text-shadow:1px 1px 3px rgba(0,0,0,0.6);
        }
        .wl-play {
          font-size:clamp(18px,3.5vw,28px); padding:14px 48px;
          min-width:200px;
          animation:wlPulse 2s ease-in-out infinite;
          background:#ff8844 !important; border-color:#ffcc44 !important;
          color:#fff !important; box-shadow:4px 4px 0 #cc4400 !important;
        }
        @keyframes wlPulse {
          0%,100%{box-shadow:4px 4px 0 #cc4400,0 0 0 rgba(255,136,68,0)!important}
          50%    {box-shadow:4px 4px 0 #cc4400,0 0 24px rgba(255,200,68,0.6)!important}
        }
        .wl-hint {
          font-size:12px; color:rgba(255,255,255,0.7);
          font-family:'Courier New',monospace; min-height:16px;
        }
      </style>`
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private attachEvents(container: HTMLElement): void {
    const btn  = container.querySelector<HTMLButtonElement>('#wlPlay')!
    const hint = container.querySelector<HTMLElement>('#wlHint')!

    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = '...'
      try { await requestFullscreen(document.documentElement) } catch { hint.textContent = '' }
      this.navigate(Screen.Home)
    })
  }

  // ── Animation: colorful tropical scene with all 3 characters ─────────────

  private startAnimation(container: HTMLElement): void {
    const canvas = container.querySelector<HTMLCanvasElement>('#wlBg')
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w   = container.clientWidth
      const h   = container.clientHeight
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
    }
    resize()

    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    const loop = () => {
      this.frame++
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      ctx.save()
      ctx.scale(dpr, dpr)
      this.drawScene(ctx, W, H, this.frame)
      ctx.restore()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  private drawScene(ctx: CanvasRenderingContext2D, W: number, H: number, frame: number): void {
    const groundY = H * 0.68

    // ── Sky ──
    const sky = ctx.createLinearGradient(0, 0, 0, groundY)
    sky.addColorStop(0, '#2288dd'); sky.addColorStop(0.6, '#44aaee'); sky.addColorStop(1, '#88ccff')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, groundY + 2)

    // ── Sun ──
    const sunX = W * 0.82, sunY = H * 0.10, sunR = H * 0.06
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.5)
    glow.addColorStop(0, 'rgba(255,240,80,0.7)'); glow.addColorStop(1, 'rgba(255,220,0,0)')
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sunX, sunY, sunR * 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffee44'; ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffffa0'; ctx.beginPath(); ctx.arc(sunX - sunR * 0.2, sunY - sunR * 0.25, sunR * 0.45, 0, Math.PI * 2); ctx.fill()

    // ── Clouds (slow drift) ──
    const drift = frame * 0.12
    ;[[W*0.12, H*0.08, 90, 36], [W*0.45, H*0.06, 70, 28], [W*0.65, H*0.11, 100, 38]].forEach(([cx, cy, cw, ch]) => {
      const x = ((cx - drift) % (W + 200) + W + 200) % (W + 200)
      ctx.fillStyle = '#e0f0ff'
      ctx.beginPath(); ctx.ellipse(x + cw * 0.1, cy + ch * 0.3, cw * 0.4, ch * 0.3, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.ellipse(x, cy, cw * 0.48, ch * 0.48, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(x - cw * 0.28, cy + ch * 0.08, cw * 0.33, ch * 0.36, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(x + cw * 0.28, cy + ch * 0.06, cw * 0.36, ch * 0.4, 0, 0, Math.PI * 2); ctx.fill()
    })

    // ── Distant hills ──
    ctx.fillStyle = '#58c858'
    ;[[W*0.15, H*0.15], [W*0.42, H*0.12], [W*0.72, H*0.18]].forEach(([cx, amp]) => {
      ctx.beginPath(); ctx.ellipse(cx, groundY + 4, amp * 2.0, amp * 0.9, 0, 0, Math.PI * 2); ctx.fill()
    })

    // ── Trees (left and right sides) ──
    drawWelcomeTree(ctx, W * 0.05, groundY, H * 0.30)
    drawWelcomeTree(ctx, W * 0.92, groundY, H * 0.26)
    drawWelcomeTree(ctx, W * 0.15, groundY, H * 0.18)
    drawWelcomeTree(ctx, W * 0.82, groundY, H * 0.20)

    // ── Ground ──
    const gnd = ctx.createLinearGradient(0, groundY, 0, H)
    gnd.addColorStop(0, '#48cc48'); gnd.addColorStop(0.3, '#38b038'); gnd.addColorStop(1, '#1a6018')
    ctx.fillStyle = gnd; ctx.fillRect(0, groundY, W, H - groundY)
    ctx.fillStyle = '#70e870'; ctx.fillRect(0, groundY, W, 3)

    // ── Flowers scattered on ground ──
    const flowerPositions = [0.25, 0.38, 0.52, 0.65, 0.75, 0.20, 0.44, 0.58, 0.70, 0.80]
    const flowerColors    = ['#ff88aa','#ffffff','#ffee44','#ff66cc','#ff88aa','#ffffff','#ffee44','#ff66cc','#ff88aa','#ffffff']
    const flowerHeights   = [6, 10, 5, 8, 12, 7, 9, 4, 11, 6]
    flowerPositions.forEach((xf, i) => {
      const fx = W * xf, fy = groundY + flowerHeights[i]
      const c  = flowerColors[i], sz = 3
      ctx.fillStyle = c
      ctx.fillRect(fx - sz, fy - sz, sz * 2 + 1, 1); ctx.fillRect(fx, fy - sz, 1, sz * 2 + 1)
      ctx.fillStyle = '#ffee44'; ctx.fillRect(fx - 1, fy - 1, 3, 3)
      ctx.fillStyle = '#38b038'; ctx.fillRect(fx, fy + sz, 1, 4)
    })

    // ── Pebbles ──
    ;[[W*0.31, groundY+18, 7, 5], [W*0.60, groundY+22, 9, 6], [W*0.48, groundY+15, 6, 4]].forEach(([px, py, pw, ph]) => {
      ctx.fillStyle = '#b0b090'; ctx.fillRect(px, py, pw, ph)
      ctx.fillStyle = '#d0d0b0'; ctx.fillRect(px, py, pw, 1)
      ctx.fillStyle = '#808070'; ctx.fillRect(px, py + ph - 1, pw, 1)
    })

    // ── Waterfall (left side, like reference image) ──
    if (W > 300) {
      const wfX = W * 0.02, wfY = H * 0.3, wfH = groundY - wfY
      ctx.fillStyle = '#2266aa'; ctx.fillRect(wfX, wfY, W * 0.04, wfH)
      const wfGrad = ctx.createLinearGradient(wfX, 0, wfX + W * 0.04, 0)
      wfGrad.addColorStop(0, 'rgba(160,220,255,0.7)'); wfGrad.addColorStop(0.5, 'rgba(255,255,255,0.9)'); wfGrad.addColorStop(1, 'rgba(160,220,255,0.5)')
      ctx.fillStyle = wfGrad; ctx.fillRect(wfX, wfY, W * 0.04, wfH)
      // Mist at base
      ctx.fillStyle = 'rgba(200,240,255,0.4)'; ctx.beginPath(); ctx.ellipse(wfX + W * 0.02, groundY + 4, W * 0.06, 8, 0, 0, Math.PI * 2); ctx.fill()
    }

    // ── The 3 characters (cute, from reference style) ──
    const s    = Math.max(2, Math.floor(H * 0.24 / 20))
    const bobY = Math.sin(frame * 0.05) * 2  // gentle idle bob

    // Positions spaced across the scene
    const charY = groundY - 18 * s + bobY

    // Opossum (left)
    OPOS_FRAME.draw(ctx, W * 0.28 - 14 * s, charY, s)
    // Dino (center, slightly taller — biped so lower Y)
    DINO_FRAME.draw(ctx, W * 0.50 - 10 * s, groundY - 28 * s + bobY, s)
    // Capybara (right)
    CAPI_FRAME.draw(ctx, W * 0.68 - 12 * s, charY + s * 2, s)

    // Shadows under characters
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath(); ctx.ellipse(W * 0.28, groundY + 3, 18 * s * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(W * 0.50, groundY + 3, 14 * s * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(W * 0.68, groundY + 3, 18 * s * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill()
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function drawWelcomeTree(ctx: CanvasRenderingContext2D, cx: number, baseY: number, h: number) {
  ctx.fillStyle = '#7a4010'
  ctx.fillRect(cx - h * 0.06, baseY - h * 0.4, h * 0.12, h * 0.4)
  ctx.fillStyle = '#1a6a18'
  ctx.beginPath(); ctx.arc(cx, baseY - h * 0.55, h * 0.38, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#28a030'
  ctx.beginPath(); ctx.arc(cx - h * 0.18, baseY - h * 0.72, h * 0.28, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + h * 0.2, baseY - h * 0.68, h * 0.26, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx, baseY - h * 0.85, h * 0.22, 0, Math.PI * 2); ctx.fill()
}

