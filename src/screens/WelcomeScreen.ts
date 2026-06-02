import { Screen } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'
import { requestFullscreen } from '../core/Fullscreen'

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
      <div class="welcome-bg">
        <div class="welcome-stars" id="wStars"></div>

        <div class="welcome-center">
          <canvas id="wAnimal" width="80" height="80"></canvas>

          <div class="welcome-title">
            <span class="wt-letter" style="--i:0">M</span>
            <span class="wt-letter" style="--i:1">A</span>
            <span class="wt-letter" style="--i:2">T</span>
            <span class="wt-letter" style="--i:3">E</span>
            <span class="wt-dash">-</span>
            <span class="wt-letter" style="--i:4">M</span>
            <span class="wt-letter" style="--i:5">A</span>
            <span class="wt-letter" style="--i:6">T</span>
            <span class="wt-letter" style="--i:7">E</span>
          </div>

          <p class="welcome-sub">¡Practica matemáticas!</p>

          <button class="btn btn--accent welcome-play" id="wPlay">
            ▶ &nbsp;JUGAR
          </button>

          <p class="welcome-hint" id="wHint"></p>
        </div>

        <div class="welcome-floor"></div>
      </div>

      <style>
        .welcome-bg {
          width: 100%; height: 100%;
          background: linear-gradient(180deg, #050510 0%, #0a0a2a 60%, #1a0a3a 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: space-between;
          overflow: hidden; position: relative;
        }
        .welcome-stars {
          position: absolute; inset: 0; pointer-events: none;
        }
        .welcome-center {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: clamp(12px, 2.5vh, 24px);
          flex: 1; z-index: 1; padding: 16px;
        }
        .welcome-title {
          display: flex; align-items: baseline; gap: 2px;
          filter: drop-shadow(0 0 12px #f0c04088);
        }
        .wt-letter {
          font-size: clamp(32px, 7vw, 72px);
          font-family: 'Courier New', monospace;
          font-weight: 900;
          color: #f0c040;
          display: inline-block;
          animation: letterBounce 0.6s ease calc(var(--i) * 60ms) both;
          text-shadow: 3px 3px 0 #8a6000, 6px 6px 0 #4a3000;
          letter-spacing: 2px;
        }
        .wt-dash {
          font-size: clamp(24px, 5vw, 56px);
          color: #a07020;
          font-family: 'Courier New', monospace;
          font-weight: 900;
          padding: 0 2px;
        }
        @keyframes letterBounce {
          0%   { opacity:0; transform: translateY(-40px) scale(0.5); }
          70%  { transform: translateY(6px) scale(1.1); }
          100% { opacity:1; transform: translateY(0) scale(1); }
        }
        .welcome-sub {
          font-family: 'Courier New', monospace;
          font-size: clamp(13px, 2.5vw, 20px);
          color: #a090c0;
          letter-spacing: 2px;
        }
        .welcome-play {
          font-size: clamp(18px, 3.5vw, 28px);
          padding: 14px 40px;
          min-width: 180px;
          animation: pulseGlow 2s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 4px 4px 0 #c09020, 0 0 0 rgba(240,192,64,0); }
          50%       { box-shadow: 4px 4px 0 #c09020, 0 0 20px rgba(240,192,64,0.4); }
        }
        .welcome-hint {
          font-size: 12px; color: #5050a0;
          font-family: 'Courier New', monospace;
          min-height: 16px; text-align: center;
        }
        .welcome-floor {
          width: 100%; height: clamp(24px, 5vh, 48px);
          background: repeating-linear-gradient(
            90deg,
            #1a1040 0px, #1a1040 32px,
            #221850 32px, #221850 64px
          );
          border-top: 4px solid #4a4090;
          flex-shrink: 0;
        }
        #wAnimal {
          image-rendering: pixelated;
          width: clamp(60px, 12vw, 96px);
          height: clamp(60px, 12vw, 96px);
        }
      </style>
    `
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private attachEvents(container: HTMLElement): void {
    const btn  = container.querySelector<HTMLButtonElement>('#wPlay')!
    const hint = container.querySelector<HTMLElement>('#wHint')!

    btn.addEventListener('click', async () => {
      btn.disabled = true
      btn.textContent = '...'
      try {
        await requestFullscreen(document.documentElement)
      } catch {
        hint.textContent = 'Fullscreen no disponible'
      }
      this.navigate(Screen.Home)
    })
  }

  // ── Pixel-art dino animation ──────────────────────────────────────────────

  private startAnimation(container: HTMLElement): void {
    const canvas = container.querySelector<HTMLCanvasElement>('#wAnimal')
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const stars = container.querySelector<HTMLElement>('#wStars')!
    this.buildStars(stars)

    const loop = () => {
      this.frame++
      this.drawDino(ctx, canvas.width, canvas.height, this.frame)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  private buildStars(el: HTMLElement): void {
    const count = 60
    let html = ''
    for (let i = 0; i < count; i++) {
      const x    = Math.random() * 100
      const y    = Math.random() * 80
      const size = Math.random() < 0.2 ? 3 : 2
      const dur  = 1.5 + Math.random() * 3
      const del  = Math.random() * 3
      html += `<div style="
        position:absolute;
        left:${x}%;top:${y}%;
        width:${size}px;height:${size}px;
        background:#fff;
        opacity:0;
        animation:starTwinkle ${dur}s ${del}s ease-in-out infinite alternate;
      "></div>`
    }
    el.innerHTML = html + `
      <style>
        @keyframes starTwinkle {
          from { opacity:0.1; }
          to   { opacity:0.9; }
        }
      </style>`
  }

  private drawDino(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number): void {
    ctx.clearRect(0, 0, w, h)
    const s = 4   // pixel size
    const bobY = Math.sin(frame * 0.08) * 2

    // Color palette
    const GREEN      = '#5ad45a'
    const GREEN_DARK = '#2a8c2a'
    const GREEN_EYE  = '#ffffff'
    const YELLOW     = '#f0c040'

    const px = (col: string, gx: number, gy: number, gw = 1, gh = 1) => {
      ctx.fillStyle = col
      ctx.fillRect(
        Math.floor(w / 2 + gx * s - (10 * s) / 2),
        Math.floor(h / 2 + gy * s + bobY - (10 * s) / 2),
        gw * s, gh * s,
      )
    }

    // Legs (alternate stride)
    const legPhase = Math.floor(frame / 8) % 2
    if (legPhase === 0) {
      px(GREEN_DARK, 3, 8); px(GREEN_DARK, 4, 8)
      px(GREEN_DARK, 6, 8); px(GREEN_DARK, 7, 9)
    } else {
      px(GREEN_DARK, 3, 8); px(GREEN_DARK, 4, 9)
      px(GREEN_DARK, 6, 8); px(GREEN_DARK, 7, 8)
    }

    // Tail
    px(GREEN, 0, 5); px(GREEN, 1, 5)
    px(GREEN_DARK, 0, 6)

    // Body
    px(GREEN, 2, 4, 6, 4)
    px(GREEN_DARK, 2, 4); px(GREEN_DARK, 7, 4)
    px(GREEN_DARK, 2, 7); px(GREEN_DARK, 7, 7)

    // Belly
    px('#8aec8a', 3, 5, 3, 2)

    // Neck
    px(GREEN, 6, 3, 2, 2)

    // Head
    px(GREEN, 6, 1, 3, 3)
    px(GREEN_DARK, 6, 1); px(GREEN_DARK, 8, 1)
    px(GREEN_DARK, 6, 3); px(GREEN_DARK, 8, 3)

    // Eye
    px(GREEN_EYE, 7, 2); px('#000', 7, 2)  // overwrite with pupil
    ctx.fillStyle = '#000'
    ctx.fillRect(
      Math.floor(w / 2 + 7 * s - (10 * s) / 2),
      Math.floor(h / 2 + 2 * s + bobY - (10 * s) / 2),
      s, s,
    )
    ctx.fillStyle = GREEN_EYE
    ctx.fillRect(
      Math.floor(w / 2 + 7 * s - (10 * s) / 2) + s / 2,
      Math.floor(h / 2 + 2 * s + bobY - (10 * s) / 2),
      s / 2, s / 2,
    )

    // Arms
    px(GREEN, 5, 5); px(GREEN_DARK, 5, 6)

    // Spikes on back
    px(YELLOW, 3, 3); px(YELLOW, 4, 2); px(YELLOW, 5, 3)
  }
}
