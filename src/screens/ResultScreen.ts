import { Animal, GameResult, Operation, Screen } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'
import { storage } from '../storage/StorageService'
import { getAnimalVictoryGameSheet } from '../graphics/GameSprites'

const OP_LABELS: Record<Operation, string> = {
  [Operation.Addition]: '+ SUMA',
  [Operation.Subtraction]: '− RESTA',
  [Operation.Multiplication]: '× MULTIPLICACIÓN',
  [Operation.Division]: '÷ DIVISIÓN',
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export class ResultScreen implements BaseScreen {
  private container: HTMLElement | null = null
  private scoreRaf: number | null = null
  private animalRaf: number | null = null

  constructor(
    private navigate: NavigateFn,
    private result: GameResult,
  ) {}

  mount(container: HTMLElement): void {
    this.container = container
    container.innerHTML = this.html()
    this.attachStyles(container)
    this.attachEvents(container)
    this.animateScore(container)
    this.animateAnimal(container)
  }

  unmount(): void {
    if (this.scoreRaf !== null) cancelAnimationFrame(this.scoreRaf)
    if (this.animalRaf !== null) cancelAnimationFrame(this.animalRaf)
    this.scoreRaf = null
    this.animalRaf = null
    if (this.container) this.container.innerHTML = ''
    this.container = null
  }

  private html(): string {
    const r = this.result
    const opLabel = OP_LABELS[r.operation] ?? r.operation

    return `
      <div class="rs-root">
        <div class="rs-header">
          <span class="rs-op-label">${opLabel}</span>
          <span class="rs-title">LO LOGRASTE</span>
        </div>

        <div class="rs-body">
          <div class="rs-hero">
            <div class="rs-score-wrap">
              <div class="rs-score" id="rScore">0%</div>
              <div class="rs-score-sub">precisión total</div>
            </div>
            <canvas id="rAnimal" class="rs-animal" width="220" height="180"></canvas>
            <div class="rs-message">Meta completada. Ahora sí vale estrella.</div>
          </div>

          <div class="rs-stats">
            <div class="rs-stat-row"><span class="rs-stat-icon" style="color:#40d060">✓</span><span class="rs-stat-val">${r.correct}</span><span class="rs-stat-label">correctas</span></div>
            <div class="rs-stat-row"><span class="rs-stat-icon" style="color:#d04040">✗</span><span class="rs-stat-val">${r.incorrect}</span><span class="rs-stat-label">incorrectas</span></div>
            <div class="rs-stat-row"><span class="rs-stat-icon" style="color:#f0c040">★</span><span class="rs-stat-val">${r.currentTarget}</span><span class="rs-stat-label">meta alcanzada</span></div>
            <div class="rs-stat-row"><span class="rs-stat-icon" style="color:#8888cc">⏱</span><span class="rs-stat-val">${formatTime(r.durationMs)}</span><span class="rs-stat-label">tiempo</span></div>
          </div>
        </div>

        <div class="rs-actions">
          <button class="btn btn--accent rs-btn" id="rRetry">↺ REPETIR</button>
          <button class="btn rs-btn" id="rHome">⌂ MENÚ</button>
        </div>
      </div>`
  }

  private animateScore(container: HTMLElement): void {
    const target = this.result.percentCorrect
    const el = container.querySelector<HTMLElement>('#rScore')
    if (!el) return
    const start = performance.now()
    const duration = 1100

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      el.textContent = `${Math.round(eased * target)}%`
      if (t < 1) this.scoreRaf = requestAnimationFrame(step)
    }
    this.scoreRaf = requestAnimationFrame(step)
  }

  private animateAnimal(container: HTMLElement): void {
    const canvas = container.querySelector<HTMLCanvasElement>('#rAnimal')
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const animal = storage.loadSettings().animal as Animal
    const sheet = getAnimalVictoryGameSheet(animal)
    const loopFrames = [0, 1, 2, 1]

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const frame = sheet.frames[loopFrames[Math.floor(ts / 180) % loopFrames.length]] ?? sheet.frames[0]
      if (frame) {
        const s = Math.max(1, Math.min(
          Math.floor((canvas.width - 20) / frame.gridW),
          Math.floor((canvas.height - 18) / frame.gridH),
        ))
        const bobY = loopFrames[Math.floor(ts / 180) % loopFrames.length] === 2 ? -4 : -1
        const ox = Math.floor((canvas.width - frame.gridW * s) / 2)
        const oy = Math.floor(canvas.height - frame.gridH * s - 6 + bobY)
        frame.draw(ctx, ox, oy, s)
      }
      this.animalRaf = requestAnimationFrame(draw)
    }

    this.animalRaf = requestAnimationFrame(draw)
  }

  private attachEvents(container: HTMLElement): void {
    container.querySelector('#rRetry')?.addEventListener('click', () =>
      this.navigate(Screen.Game, this.result.operation),
    )
    container.querySelector('#rHome')?.addEventListener('click', () =>
      this.navigate(Screen.Home),
    )
  }

  private attachStyles(container: HTMLElement): void {
    const s = document.createElement('style')
    s.textContent = `
      .rs-root {
        width:100%; height:100%; display:flex; flex-direction:column;
        background:radial-gradient(ellipse at center, #141433 0%, #060612 100%);
        overflow:auto;
      }
      .rs-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 16px; background:#0a0a1e;
        border-bottom:3px solid #2a2a5a; flex-shrink:0;
      }
      .rs-op-label {
        font-family:'Courier New',monospace;
        font-size:clamp(11px,2vw,16px); color:#8888cc; letter-spacing:2px;
      }
      .rs-title {
        font-family:'Courier New',monospace;
        font-size:clamp(20px,4vw,32px); font-weight:900;
        color:#f0c040; letter-spacing:3px;
        text-shadow:2px 2px 0 #8a6000;
      }
      .rs-body {
        flex:1; display:flex; flex-direction:column; align-items:center;
        justify-content:center; gap:14px; padding:14px 16px;
      }
      .rs-hero {
        display:flex; flex-direction:column; align-items:center; gap:10px;
      }
      .rs-score-wrap { text-align:center; }
      .rs-score {
        font-family:'Courier New',monospace;
        font-size:clamp(44px,10vw,82px);
        font-weight:900; line-height:1; color:#40d060;
        text-shadow:3px 3px 0 rgba(0,0,0,0.45);
      }
      .rs-score-sub {
        font-family:'Courier New',monospace; font-size:12px;
        color:#8080c0; letter-spacing:2px;
      }
      .rs-animal {
        width:min(220px, 72vw);
        height:auto;
        aspect-ratio:220 / 180;
        image-rendering:pixelated;
      }
      .rs-message {
        font-family:'Courier New',monospace;
        font-size:clamp(12px,2vw,16px); color:#f0c040;
        letter-spacing:1px; text-align:center;
      }
      .rs-stats {
        width:min(420px, 100%);
        display:grid; grid-template-columns:1fr 1fr; gap:8px;
      }
      .rs-stat-row {
        display:flex; align-items:center; gap:8px;
        font-family:'Courier New',monospace;
        background:#0a0a1e; border:2px solid #2a2a5a; padding:10px 12px;
      }
      .rs-stat-icon { font-size:16px; width:20px; text-align:center; }
      .rs-stat-val { font-size:clamp(16px,3vw,24px); font-weight:bold; color:#e8e8f0; min-width:42px; }
      .rs-stat-label { font-size:11px; color:#6060a0; letter-spacing:1px; }
      .rs-actions {
        display:flex; gap:10px; padding:10px 16px;
        background:#0a0a1e; border-top:3px solid #2a2a5a;
        flex-shrink:0;
      }
      .rs-btn { flex:1; font-size:clamp(14px,2.5vw,20px); padding:12px; min-height:48px; }
      @media (max-width: 520px) {
        .rs-stats { grid-template-columns:1fr; }
      }
    `
    container.appendChild(s)
  }
}
