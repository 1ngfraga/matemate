import { Animal, GameMode, Operation, Screen, Settings } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'
import { storage } from '../storage/StorageService'
import { ProgressAggregator } from '../chart/ProgressAggregator'
import { ChartRenderer } from '../chart/ChartRenderer'
import { getAnimalGameSheet } from '../graphics/GameSprites'

const ANIMAL_META: Record<Animal, { label: string; colors: string[] }> = {
  [Animal.Dinosaur]: { label: 'T-REX',  colors: ['#5ad45a', '#2a8c2a', '#f0c040'] },
  [Animal.Opossum]:  { label: 'TLACUA', colors: ['#aaaaaa', '#606060', '#ffaaaa'] },
  [Animal.Capybara]: { label: 'CAPI',   colors: ['#c8843c', '#7a4a18', '#e8c890'] },
}

const OP_META: Array<{ op: Operation; symbol: string; label: string; color: string }> = [
  { op: Operation.Addition,       symbol: '+', label: 'SUMA',     color: '#4060d0' },
  { op: Operation.Subtraction,    symbol: '−', label: 'RESTA',    color: '#8030a0' },
  { op: Operation.Multiplication, symbol: '×', label: 'MULTI',    color: '#207050' },
  { op: Operation.Division,       symbol: '÷', label: 'DIVISIÓN', color: '#904020' },
]

export class HomeScreen implements BaseScreen {
  private container: HTMLElement | null = null
  private chart: ChartRenderer | null = null
  private settings: Settings
  private previewRaf: number | null = null

  constructor(
    private navigate: NavigateFn,
    private mode: GameMode,
    initialSettings: Settings,
    private onSettingsChange: (mode: GameMode, s: Settings) => void,
  ) {
    this.settings = { ...initialSettings }
  }

  mount(container: HTMLElement): void {
    this.container = container
    container.innerHTML = this.html()
    this.attachStyles(container)
    this.renderAnimalPreviews(container)
    this.initChart(container)
    this.attachEvents(container)
  }

  unmount(): void {
    if (this.previewRaf !== null) cancelAnimationFrame(this.previewRaf)
    this.previewRaf = null
    this.chart = null
    if (this.container) this.container.innerHTML = ''
    this.container = null
  }

  // ── HTML ─────────────────────────────────────────────────────────────────

  private html(): string {
    const animalBtns = (Object.keys(ANIMAL_META) as Animal[]).map((a) => {
      const meta = ANIMAL_META[a]
      const sel  = a === this.settings.animal
      return `
        <button class="animal-btn${sel ? ' animal-btn--selected' : ''}" data-animal="${a}">
          <canvas class="animal-mini" width="104" height="84" data-animal="${a}"></canvas>
          <span class="animal-label">${meta.label}</span>
        </button>`
    }).join('')

    const opBtns = OP_META.map(({ op, symbol, label, color }) => `
      <button class="home-op-btn" data-op="${op}"
        style="--op-color:${color};--op-border:${color}cc;">
        <span class="op-symbol">${symbol}</span>
        <span class="op-label">${label}</span>
      </button>`
    ).join('')

    return `
      <div class="home-root">
        <header class="home-header">
          <span class="home-logo">MATE<span style="color:#8888ff">MATE</span></span>
          <div class="home-header-actions">
            <span class="home-mode-badge">${this.mode === GameMode.Play ? 'MODO JUGAR' : 'PRÁCTICA LIBRE'}</span>
            <button class="btn home-settings-btn" id="hSettings">⚙ CONFIG</button>
          </div>
        </header>

        <div class="home-body">
          <!-- Left / Top: chart -->
          <section class="home-chart-section">
            ${this.mode === GameMode.Play ? `
              <div class="home-section-label">▸ INTENTOS (14 DÍAS)</div>
              <div class="home-chart-wrap" id="hChartWrap">
                <canvas id="hChart" class="home-chart"></canvas>
              </div>
            ` : `
              <div class="home-section-label">▸ PRÁCTICA LIBRE</div>
              <div class="home-chart-wrap home-chart-wrap--empty">
                <div class="home-free-note">Aquí no se guardan premios ni estadísticas.</div>
              </div>
            `}
          </section>

          <!-- Right / Bottom: animal + ops -->
          <section class="home-controls">
            <div class="home-section-label">▸ TU ANIMAL</div>
            <div class="home-animals">${animalBtns}</div>

            <div class="home-section-label" style="margin-top:8px;">▸ JUGAR</div>
            <div class="home-ops">${opBtns}</div>
          </section>
        </div>
      </div>`
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  private attachStyles(container: HTMLElement): void {
    const s = document.createElement('style')
    s.textContent = `
      .home-root {
        width:100%; height:100%;
        display:flex; flex-direction:column;
        background:var(--color-bg);
        overflow:hidden;
      }
      .home-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:6px 12px;
        background:#0d0d22;
        border-bottom:3px solid #2a2a5a;
        flex-shrink:0;
      }
      .home-logo {
        font-family:'Courier New',monospace;
        font-size:clamp(16px,3vw,26px);
        font-weight:900; color:#f0c040;
        letter-spacing:3px;
        text-shadow:2px 2px 0 #8a6000;
      }
      .home-settings-btn {
        font-size:12px; padding:6px 12px;
        min-height:36px; min-width:80px;
      }
      .home-header-actions {
        display:flex;
        align-items:center;
        gap:8px;
      }
      .home-mode-badge {
        font-family:'Courier New',monospace;
        font-size:10px;
        color:${this.mode === GameMode.Play ? '#f0c040' : '#80b0ff'};
        background:${this.mode === GameMode.Play ? '#241800' : '#102040'};
        border:2px solid ${this.mode === GameMode.Play ? '#8a6000' : '#4060d0'};
        padding:5px 8px;
        letter-spacing:1px;
      }

      .home-body {
        display:flex; flex:1; gap:8px;
        padding:8px; overflow:hidden;
        /* Landscape: side by side. Portrait: stacked. */
        flex-direction:row;
      }
      @media (max-aspect-ratio:1/1) {
        .home-body { flex-direction:column; }
        .home-chart-section { min-height:140px; }
      }

      .home-chart-section {
        flex:1.3; display:flex; flex-direction:column; gap:4px; min-width:0;
      }
      .home-controls {
        flex:1; display:flex; flex-direction:column; gap:4px; min-width:0;
      }

      .home-section-label {
        font-family:'Courier New',monospace;
        font-size:clamp(9px,1.6vw,13px);
        color:#5050a0; letter-spacing:2px;
        flex-shrink:0;
      }

      /* Chart */
      .home-chart-wrap {
        flex:1; position:relative; min-height:80px;
        background:#0d0d22;
        border:2px solid #2a2a5a;
      }
      .home-chart-wrap--empty {
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
      }
      .home-free-note {
        font-family:'Courier New',monospace;
        color:#80b0ff;
        text-align:center;
        font-size:clamp(12px, 2vw, 16px);
        line-height:1.5;
      }
      .home-chart {
        position:absolute; inset:0; width:100%; height:100%;
        image-rendering:pixelated; cursor:crosshair;
      }
      .tt-date  { color:#f0c040; font-weight:bold; font-size:12px; }
      .tt-pct   { color:#e8e8f0; font-size:14px; }
      .tt-games { color:#8888aa; font-size:10px; }

      /* Animals */
      .home-animals {
        display:flex;
        gap:6px;
        flex-wrap:nowrap;
      }
      .animal-btn {
        display:flex; flex-direction:column; align-items:center; gap:2px;
        background:#0d0d22; border:3px solid #3a3a6a;
        padding:6px 8px 5px; cursor:pointer;
        font-family:'Courier New',monospace;
        transition:transform 80ms, border-color 80ms;
        flex:1 1 0;
        min-width:0;
        width:100%;
        -webkit-tap-highlight-color:transparent;
      }
      .animal-btn:active { transform:translate(1px,1px); }
      .animal-btn--selected {
        border-color:#f0c040;
        background:#1a1500;
        box-shadow:0 0 8px #f0c04044;
      }
      .animal-mini {
        width:min(100%, 104px);
        height:auto;
        aspect-ratio:104 / 84;
        image-rendering:pixelated;
        display:block;
      }
      .animal-label {
        font-size:clamp(7px,1.2vw,10px);
        color:#a0a0d0; letter-spacing:1px;
        white-space:nowrap;
      }
      .animal-btn--selected .animal-label { color:#f0c040; }

      /* Operation buttons */
      .home-ops {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:6px; flex:1;
      }
      .home-op-btn {
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        background:var(--op-color,#333);
        border:3px solid var(--op-border,#555);
        color:#fff; cursor:pointer;
        font-family:'Courier New',monospace;
        padding:8px 4px;
        min-height:clamp(44px,9vh,72px);
        transition:transform 80ms, filter 80ms;
        box-shadow:3px 3px 0 rgba(0,0,0,0.5);
        -webkit-tap-highlight-color:transparent;
      }
      .home-op-btn:active {
        transform:translate(2px,2px);
        box-shadow:1px 1px 0 rgba(0,0,0,0.5);
      }
      .home-op-btn:hover { filter:brightness(1.25); }
      .op-symbol { font-size:clamp(18px,3.5vw,30px); font-weight:900; line-height:1; }
      .op-label  { font-size:clamp(8px,1.4vw,12px); letter-spacing:1px; margin-top:2px; }

      @media (max-width: 1100px) and (min-aspect-ratio: 1/1) {
        .home-body { gap:6px; padding:6px; }
        .home-controls { flex:0.95; }
        .home-animals { gap:4px; }
        .animal-btn {
          padding:4px 4px 3px;
          border-width:2px;
        }
        .animal-mini {
          width:min(100%, 84px);
        }
        .animal-label {
          font-size:clamp(6px, 1vw, 8px);
          letter-spacing:0.5px;
        }
        .home-ops { gap:4px; }
        .home-op-btn {
          padding:6px 2px;
          min-height:clamp(40px, 8vh, 60px);
          border-width:2px;
        }
        .op-symbol { font-size:clamp(15px, 2.6vw, 22px); }
        .op-label  { font-size:clamp(7px, 1vw, 10px); }
      }

      @media (max-width: 900px) and (min-aspect-ratio: 1/1) {
        .home-controls { flex:0.9; }
        .animal-mini {
          width:min(100%, 72px);
        }
        .home-settings-btn {
          min-width:70px;
          padding:6px 8px;
          font-size:11px;
        }
      }
    `
    container.appendChild(s)
  }

  // ── Animal pixel-art previews ─────────────────────────────────────────────

  // Use the same game sprites in the selector, with a simple walk loop.
  private renderAnimalPreviews(container: HTMLElement): void {
    const canvases = [...container.querySelectorAll<HTMLCanvasElement>('canvas.animal-mini')]
    const loop = (ts: number) => {
      const walkFrames = [0, 1, 2, 1]
      const selectedAnimal = this.settings.animal

      canvases.forEach((canvas) => {
        const animal = canvas.dataset.animal as Animal
        const ctx    = canvas.getContext('2d')!
        const W      = canvas.width
        const H      = canvas.height
        ctx.clearRect(0, 0, W, H)

        const sheet  = getAnimalGameSheet(animal)
        const animFrame = animal === selectedAnimal
          ? walkFrames[Math.floor(ts / 180) % walkFrames.length]
          : 0
        const frame  = sheet.frames[animFrame] ?? sheet.frames[0]
        if (!frame) return

        const scaleX = Math.floor((W - 10) / frame.gridW)
        const scaleY = Math.floor((H - 12) / frame.gridH)
        const s      = Math.max(1, Math.min(scaleX, scaleY))
        const bobY   = animal === selectedAnimal
          ? (animFrame === 1 ? -1 : animFrame === 2 ? -2 : 0)
          : 0
        const ox     = Math.floor((W - frame.gridW * s) / 2)
        const oy     = Math.floor(H - frame.gridH * s - 4 + bobY)
        frame.draw(ctx, ox, oy, s)
      })

      this.previewRaf = requestAnimationFrame(loop)
    }

    if (this.previewRaf !== null) cancelAnimationFrame(this.previewRaf)
    this.previewRaf = requestAnimationFrame(loop)
  }

  // ── Chart ─────────────────────────────────────────────────────────────────

  private initChart(container: HTMLElement): void {
    const canvas = container.querySelector<HTMLCanvasElement>('#hChart')
    const wrap   = container.querySelector<HTMLElement>('#hChartWrap')
    if (!canvas || !wrap) return

    this.chart = new ChartRenderer(canvas, wrap)

    // Defer until layout is complete so getBoundingClientRect is accurate
    requestAnimationFrame(() => {
      const results = storage.loadResults(this.mode)
      const days    = ProgressAggregator.getLast14Days(results)
      this.chart!.render(days)
    })
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private attachEvents(container: HTMLElement): void {
    // Settings button
    container.querySelector('#hSettings')?.addEventListener('click', () => {
      this.navigate(Screen.Settings)
    })

    // Animal selector
    container.querySelectorAll<HTMLElement>('.animal-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const animal = btn.dataset.animal as Animal
        if (!animal) return
        this.settings = { ...this.settings, animal }
        this.onSettingsChange(this.mode, this.settings)

        // Update selected state
        container.querySelectorAll('.animal-btn').forEach((b) =>
          b.classList.toggle('animal-btn--selected', b === btn),
        )
      })
    })

    // Operation buttons
    container.querySelectorAll<HTMLElement>('.home-op-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const op = btn.dataset.op as Operation
        if (!op) return
        this.navigate(Screen.Game, op)
      })
    })
  }
}
