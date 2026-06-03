import { GameResult, Operation, Screen } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'
import { storage } from '../storage/StorageService'
import { getAnimalSheet, FRAME_VICTORY, FRAME_HIT } from '../graphics/AnimalSprites'
import { drawSprite } from '../graphics/SpriteFactory'

// ── Static data ───────────────────────────────────────────────────────────

const OP_LABELS: Record<Operation, string> = {
  [Operation.Addition]:       '+ SUMA',
  [Operation.Subtraction]:    '− RESTA',
  [Operation.Multiplication]: '× MULTIPLICACIÓN',
  [Operation.Division]:       '÷ DIVISIÓN',
}

interface MessageBand { min: number; title: string; sub: string }
const BANDS: MessageBand[] = [
  { min: 100, title: '¡PLATINADO!',        sub: 'Meta lograda perfecto, sin un solo fallo.' },
  { min:  90, title: '¡META LOGRADA!',     sub: 'Llegó a la meta con una racha increíble.' },
  { min:  80, title: '¡META LOGRADA!',     sub: 'Superó la meta. Ahora a repetirlo.' },
  { min:  70, title: '¡META LOGRADA!',     sub: 'Lo consiguió. Siguiente ronda.' },
  { min:  60, title: '¡META LOGRADA!',     sub: 'Meta completa. Buena constancia.' },
  { min:  50, title: '¡META LOGRADA!',     sub: 'Costó, pero llegó. Eso cuenta mucho.' },
  { min:   0, title: '¡META LOGRADA!',     sub: 'Siguió insistiendo hasta cumplir la racha.' },
]

function getBand(pct: number): MessageBand {
  return BANDS.find((b) => pct >= b.min) ?? BANDS[BANDS.length - 1]
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function scoreColor(pct: number): string {
  return pct >= 80 ? '#40d060' : pct >= 60 ? '#f0c040' : '#d04040'
}

// ── Screen ────────────────────────────────────────────────────────────────

export class ResultScreen implements BaseScreen {
  private container: HTMLElement | null = null
  private raf: number | null = null

  constructor(
    private navigate: NavigateFn,
    private result: GameResult,
  ) {}

  // ── Mount / Unmount ───────────────────────────────────────────────────

  mount(container: HTMLElement): void {
    this.container = container
    container.innerHTML = this.html()
    this.attachStyles(container)
    this.drawAnimal(container)
    this.attachEvents(container)
    this.animateScore(container)
  }

  unmount(): void {
    if (this.raf !== null) { cancelAnimationFrame(this.raf); this.raf = null }
    if (this.container) this.container.innerHTML = ''
    this.container = null
  }

  // ── HTML ─────────────────────────────────────────────────────────────

  private html(): string {
    const r      = this.result
    const band   = getBand(r.percentCorrect)
    const color  = scoreColor(r.percentCorrect)
    const opLabel = OP_LABELS[r.operation] ?? r.operation

    return `
      <div class="rs-root">

        <div class="rs-header">
          <span class="rs-op-label">${opLabel}</span>
          <span class="rs-title">${band.title}</span>
        </div>

        <div class="rs-body">

          <!-- Left: score + animal -->
          <div class="rs-left">
            <div class="rs-score-wrap">
              <div class="rs-score" id="rScore" style="color:${color}">0%</div>
              <div class="rs-score-sub">correcto</div>
            </div>
            <canvas id="rAnimal" class="rs-animal"
              width="64" height="64"></canvas>
          </div>

          <!-- Right: stats + message -->
          <div class="rs-right">
            <div class="rs-stats">
              <div class="rs-stat-row">
                <span class="rs-stat-icon" style="color:#40d060">✓</span>
                <span class="rs-stat-val">${r.correct}</span>
                <span class="rs-stat-label">correctas</span>
              </div>
              <div class="rs-stat-row">
                <span class="rs-stat-icon" style="color:#d04040">✗</span>
                <span class="rs-stat-val">${r.incorrect}</span>
                <span class="rs-stat-label">incorrectas</span>
              </div>
              <div class="rs-stat-row">
                <span class="rs-stat-icon" style="color:#f0c040">★</span>
                <span class="rs-stat-val">${r.currentTarget}</span>
                <span class="rs-stat-label">meta</span>
              </div>
              <div class="rs-stat-row">
                <span class="rs-stat-icon" style="color:#8888cc">⏱</span>
                <span class="rs-stat-val">${formatTime(r.durationMs)}</span>
                <span class="rs-stat-label">tiempo</span>
              </div>
            </div>

            <div class="rs-message">${band.sub}</div>
          </div>

        </div>

        <div class="rs-actions">
          <button class="btn btn--accent rs-btn" id="rRetry">↺ REPETIR</button>
          <button class="btn rs-btn"             id="rHome" >⌂ MENÚ</button>
        </div>

      </div>`
  }

  // ── Animal sprite ─────────────────────────────────────────────────────

  private drawAnimal(container: HTMLElement): void {
    const canvas = container.querySelector<HTMLCanvasElement>('#rAnimal')
    if (!canvas) return
    const ctx    = canvas.getContext('2d')!
    const animal = storage.loadSettings().animal
    const sheet  = getAnimalSheet(animal)
    const frame  = this.result.percentCorrect >= 60 ? FRAME_VICTORY : FRAME_HIT
    const sprite = sheet.frames[frame]
    if (!sprite) return

    const scale  = Math.floor(canvas.width / (sprite.pixels[0]?.length ?? 12))
    drawSprite(ctx, sprite, 0, 4, Math.max(2, scale))
  }

  // ── Score count-up animation ──────────────────────────────────────────

  private animateScore(container: HTMLElement): void {
    const target  = this.result.percentCorrect
    const el      = container.querySelector<HTMLElement>('#rScore')
    if (!el) return

    const start    = performance.now()
    const duration = 1100

    const step = (now: number) => {
      const t       = Math.min((now - start) / duration, 1)
      const eased   = 1 - Math.pow(1 - t, 3)  // ease-out cubic
      el.textContent = `${Math.round(eased * target)}%`
      if (t < 1) {
        this.raf = requestAnimationFrame(step)
      } else {
        // Final value snap + pulse
        el.textContent = `${target}%`
        el.style.animation = 'scorePulse 0.4s ease'
      }
    }
    this.raf = requestAnimationFrame(step)
  }

  // ── Events ────────────────────────────────────────────────────────────

  private attachEvents(container: HTMLElement): void {
    container.querySelector('#rRetry')?.addEventListener('click', () =>
      this.navigate(Screen.Game, this.result.operation),
    )
    container.querySelector('#rHome')?.addEventListener('click', () =>
      this.navigate(Screen.Home),
    )
  }

  // ── Styles ────────────────────────────────────────────────────────────

  private attachStyles(container: HTMLElement): void {
    const s = document.createElement('style')
    s.textContent = `
      .rs-root {
        width:100%; height:100%; display:flex; flex-direction:column;
        background:radial-gradient(ellipse at center, #0f0f28 0%, #050510 100%);
        overflow:hidden;
      }

      /* Header */
      .rs-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:8px 16px; background:#0a0a1e;
        border-bottom:3px solid #2a2a5a; flex-shrink:0;
      }
      .rs-op-label {
        font-family:'Courier New',monospace;
        font-size:clamp(11px,2vw,16px); color:#5050a0; letter-spacing:2px;
      }
      .rs-title {
        font-family:'Courier New',monospace;
        font-size:clamp(14px,2.8vw,22px); font-weight:900;
        color:#f0c040; letter-spacing:2px;
        text-shadow:2px 2px 0 #8a6000;
      }

      /* Body — two-column in landscape */
      .rs-body {
        display:flex; flex:1; gap:16px;
        padding:12px 16px; min-height:0;
        align-items:center;
      }
      @media (max-aspect-ratio:1/1) {
        .rs-body { flex-direction:column; gap:8px; padding:8px 12px; }
      }

      /* Left column */
      .rs-left {
        display:flex; flex-direction:column;
        align-items:center; gap:8px; flex-shrink:0;
      }
      .rs-score-wrap { text-align:center; }
      .rs-score {
        font-family:'Courier New',monospace;
        font-size:clamp(48px,10vw,88px);
        font-weight:900; line-height:1;
        text-shadow:3px 3px 0 rgba(0,0,0,0.5);
      }
      @keyframes scorePulse {
        0%   { transform:scale(1);    }
        50%  { transform:scale(1.12); }
        100% { transform:scale(1);    }
      }
      .rs-score-sub {
        font-family:'Courier New',monospace; font-size:12px;
        color:#6060a0; letter-spacing:2px;
      }
      .rs-animal {
        image-rendering:pixelated;
        width:clamp(56px,10vw,80px);
        height:clamp(56px,10vw,80px);
      }

      /* Right column */
      .rs-right {
        flex:1; display:flex; flex-direction:column;
        gap:12px; justify-content:center; min-width:0;
      }
      .rs-stats {
        display:flex; flex-direction:column; gap:6px;
        background:#0a0a1e; border:2px solid #2a2a5a; padding:10px 14px;
      }
      .rs-stat-row {
        display:flex; align-items:center; gap:8px;
        font-family:'Courier New',monospace;
      }
      .rs-stat-icon { font-size:16px; width:20px; text-align:center; }
      .rs-stat-val  {
        font-size:clamp(16px,3vw,24px); font-weight:bold; color:#e8e8f0;
        min-width:48px;
      }
      .rs-stat-label { font-size:11px; color:#6060a0; letter-spacing:1px; }

      .rs-message {
        font-family:'Courier New',monospace;
        font-size:clamp(11px,2vw,15px); color:#a0a0d0;
        line-height:1.5; letter-spacing:0.5px;
        background:#0a0a1e; border:2px solid #2a2a5a;
        padding:10px 14px;
      }

      /* Actions */
      .rs-actions {
        display:flex; gap:10px; padding:10px 16px;
        background:#0a0a1e; border-top:3px solid #2a2a5a;
        flex-shrink:0;
      }
      .rs-btn {
        flex:1; font-size:clamp(14px,2.5vw,20px);
        padding:12px; min-height:48px;
      }
    `
    container.appendChild(s)
  }
}
