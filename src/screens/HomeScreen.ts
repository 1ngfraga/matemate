import { Animal, Operation, Screen, Settings } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'
import { storage } from '../storage/StorageService'
import { ProgressAggregator } from '../chart/ProgressAggregator'
import { ChartRenderer } from '../chart/ChartRenderer'

const ANIMAL_META: Record<Animal, { label: string; colors: string[] }> = {
  [Animal.Dinosaur]: { label: 'DINO',      colors: ['#5ad45a', '#2a8c2a', '#f0c040'] },
  [Animal.Opossum]:  { label: 'TLACUACHE', colors: ['#aaaaaa', '#606060', '#ffaaaa'] },
  [Animal.Capybara]: { label: 'CAPIBARA',  colors: ['#c8843c', '#7a4a18', '#e8c890'] },
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

  constructor(
    private navigate: NavigateFn,
    initialSettings: Settings,
    private onSettingsChange: (s: Settings) => void,
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
          <canvas class="animal-mini" width="44" height="44" data-animal="${a}"></canvas>
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
          <button class="btn home-settings-btn" id="hSettings">⚙ CONFIG</button>
        </header>

        <div class="home-body">
          <!-- Left / Top: chart -->
          <section class="home-chart-section">
            <div class="home-section-label">▸ PROGRESO (14 DÍAS)</div>
            <div class="home-chart-wrap" id="hChartWrap">
              <canvas id="hChart" class="home-chart"></canvas>
            </div>
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
      .home-chart {
        position:absolute; inset:0; width:100%; height:100%;
        image-rendering:pixelated; cursor:crosshair;
      }
      .tt-date  { color:#f0c040; font-weight:bold; font-size:12px; }
      .tt-pct   { color:#e8e8f0; font-size:14px; }
      .tt-games { color:#8888aa; font-size:10px; }

      /* Animals */
      .home-animals {
        display:flex; gap:6px; flex-wrap:wrap;
      }
      .animal-btn {
        display:flex; flex-direction:column; align-items:center; gap:2px;
        background:#0d0d22; border:3px solid #3a3a6a;
        padding:5px 8px; cursor:pointer;
        font-family:'Courier New',monospace;
        transition:transform 80ms, border-color 80ms;
        min-width:62px;
        -webkit-tap-highlight-color:transparent;
      }
      .animal-btn:active { transform:translate(1px,1px); }
      .animal-btn--selected {
        border-color:#f0c040;
        background:#1a1500;
        box-shadow:0 0 8px #f0c04044;
      }
      .animal-mini { image-rendering:pixelated; }
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
    `
    container.appendChild(s)
  }

  // ── Animal pixel-art previews ─────────────────────────────────────────────

  private renderAnimalPreviews(container: HTMLElement): void {
    container.querySelectorAll<HTMLCanvasElement>('canvas.animal-mini').forEach((c) => {
      const animal = c.dataset.animal as Animal
      const ctx = c.getContext('2d')!
      this.drawAnimalMini(ctx, animal, c.width, c.height)
    })
  }

  private drawAnimalMini(ctx: CanvasRenderingContext2D, animal: Animal, w: number, h: number): void {
    const s = 3  // pixel block size
    const px = (color: string, gx: number, gy: number, gw = 1, gh = 1) => {
      ctx.fillStyle = color
      ctx.fillRect(gx * s, gy * s, gw * s, gh * s)
    }
    ctx.clearRect(0, 0, w, h)

    if (animal === Animal.Dinosaur) {
      const G = '#5ad45a', D = '#2a8c2a', Y = '#f0c040'
      // body
      px(G,  2, 4, 6, 4); px(D, 2, 4); px(D, 7, 4); px(D, 2, 7); px(D, 7, 7)
      // belly
      px('#8aec8a', 3, 5, 3, 2)
      // tail
      px(G, 0, 5); px(G, 1, 5); px(D, 0, 6)
      // neck + head
      px(G, 6, 3, 2, 2); px(G, 6, 1, 3, 3)
      // eye
      ctx.fillStyle = '#000'; ctx.fillRect(7 * s + 1, 2 * s + 1, s - 1, s - 1)
      ctx.fillStyle = '#fff'; ctx.fillRect(7 * s + s / 2, 2 * s + 1, s / 2, s / 2)
      // spikes
      px(Y, 3, 3); px(Y, 4, 2); px(Y, 5, 3)
      // legs
      px(D, 3, 8); px(D, 4, 8); px(D, 6, 8); px(D, 7, 9)

    } else if (animal === Animal.Opossum) {
      const G = '#b0b0b0', D = '#707070', P = '#ffaaaa', W = '#ffffff'
      // body
      px(G, 2, 4, 6, 4); px(D, 2, 4); px(D, 7, 4); px(D, 2, 7); px(D, 7, 7)
      // belly
      px(W, 3, 5, 3, 2)
      // tail (curly hint)
      px(D, 0, 6); px(D, 1, 7); px(D, 0, 8)
      // big ears
      px(G, 5, 0); px(G, 6, 0); px(P, 5, 1); px(G, 7, 0); px(G, 8, 1)
      // head
      px(G, 5, 2, 4, 3)
      // pointy nose
      px(G, 8, 4); px(P, 9, 4)
      // eye
      ctx.fillStyle = '#000'; ctx.fillRect(6 * s + 1, 3 * s + 1, s - 1, s - 1)
      // legs
      px(D, 3, 8); px(D, 6, 8); px(D, 4, 9); px(D, 7, 9)

    } else {
      // Capybara
      const B = '#c8843c', D = '#7a4a18', T = '#e8c890', K = '#3a2010'
      // big round body
      px(B, 1, 3, 8, 5); px(D, 1, 3); px(D, 8, 3); px(D, 1, 7); px(D, 8, 7)
      // belly
      px(T, 2, 4, 6, 3)
      // square head
      px(B, 5, 1, 4, 3)
      // nose
      px(D, 7, 3, 2, 1)
      // nostrils
      px(K, 7, 3); px(K, 8, 3)
      // eyes
      ctx.fillStyle = '#000'; ctx.fillRect(6 * s + 1, 1 * s + 1, s - 1, s - 1)
      // ears
      px(B, 5, 0); px(B, 6, 0)
      // legs
      px(D, 2, 8); px(D, 3, 9); px(D, 6, 8); px(D, 7, 9)
    }
  }

  // ── Chart ─────────────────────────────────────────────────────────────────

  private initChart(container: HTMLElement): void {
    const canvas = container.querySelector<HTMLCanvasElement>('#hChart')
    const wrap   = container.querySelector<HTMLElement>('#hChartWrap')
    if (!canvas || !wrap) return

    this.chart = new ChartRenderer(canvas, wrap)

    // Defer until layout is complete so getBoundingClientRect is accurate
    requestAnimationFrame(() => {
      const results = storage.loadResults()
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
        this.onSettingsChange(this.settings)

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
