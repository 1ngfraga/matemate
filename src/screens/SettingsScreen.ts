import { Screen, Settings, TimerDuration, AdditionOperandDigits, AdditionNumAddends, SubtractionDigits } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'

const CORRECT_PIN = '556677'
const TIMERS: TimerDuration[] = [TimerDuration.Short, TimerDuration.Medium, TimerDuration.Long]
const TIMER_LABELS: Record<TimerDuration, string> = {
  [TimerDuration.Short]:  '5s',
  [TimerDuration.Medium]: '10s',
  [TimerDuration.Long]:   '15s',
}

export class SettingsScreen implements BaseScreen {
  private container: HTMLElement | null = null
  private pin = ''
  private working!: Settings
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(
    private navigate: NavigateFn,
    private settings: Settings,
    private onSettingsChange: (s: Settings) => void,
  ) {}

  mount(container: HTMLElement): void {
    this.container = container
    this.working   = structuredClone(this.settings)
    this.pin       = ''
    container.innerHTML = this.html()
    this.attachStyles(container)
    this.attachPinEvents(container)
    this.attachKeyboard()
  }

  unmount(): void {
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler)
      this.keyboardHandler = null
    }
    if (this.container) this.container.innerHTML = ''
    this.container = null
  }

  // ── HTML ─────────────────────────────────────────────────────────────────

  private html(): string {
    return `
      <div class="ss-root">
        <!-- ① PIN Phase -->
        <div class="ss-phase" id="ssPin">
          <div class="pin-card">
            <div class="pin-icon">🔒</div>
            <div class="pin-title">CONFIGURACIÓN</div>
            <p class="pin-sub">Ingresa el PIN de acceso</p>

            <div class="pin-display" id="pinDisplay">
              ${Array.from({ length: 6 }, (_, i) =>
                `<div class="pin-dot" id="dot${i}"></div>`
              ).join('')}
            </div>

            <div class="pin-error" id="pinError">PIN incorrecto</div>

            <div class="pin-pad">
              ${[1,2,3,4,5,6,7,8,9].map(n =>
                `<button class="pin-key" data-key="${n}">${n}</button>`
              ).join('')}
              <button class="pin-key pin-key--action" data-key="back">⌫</button>
              <button class="pin-key" data-key="0">0</button>
              <button class="pin-key pin-key--action" data-key="ok">✓</button>
            </div>

            <button class="btn btn--danger pin-cancel" id="pinCancel">CANCELAR</button>
          </div>
        </div>

        <!-- ② Settings Phase (hidden until correct PIN) -->
        <div class="ss-phase ss-phase--hidden" id="ssSettings">
          ${this.settingsHtml()}
        </div>
      </div>`
  }

  // ── Digit-level button helpers ─────────────────────────────────────────

  private levelBtns(
    id: string,
    options: Array<{ value: number; label: string }>,
    current: number,
  ): string {
    return `<div class="level-row" id="${id}">` +
      options.map(({ value, label }) =>
        `<button class="level-btn${value === current ? ' level-btn--sel' : ''}"
          data-level="${value}" data-group="${id}">${label}</button>`
      ).join('') +
    `</div>`
  }

  private settingsHtml(): string {
    const w = this.working

    const timerBtns = TIMERS.map((t) => {
      const sel = t === w.timerDuration
      return `<button class="timer-btn${sel ? ' timer-btn--sel' : ''}" data-timer="${t}">${TIMER_LABELS[t]}</button>`
    }).join('')

    // Tables 1-9 only
    const tableBtns = Array.from({ length: 9 }, (_, i) => {
      const n   = i + 1
      const sel = w.multiplicationTables[n]
      return `<button class="table-btn${sel ? ' table-btn--sel' : ''}" data-table="${n}">${n}</button>`
    }).join('')

    const muteSel = w.muted

    // Addition: operand size (1-9 or 10-99)
    const addOperandOpts = [
      { value: 1, label: '1 dígito\n(1-9)' },
      { value: 2, label: '2 dígitos\n(10-99)' },
    ]
    // Addition: number of addends
    const addCountOpts = [
      { value: 2, label: '2 números\n1+2' },
      { value: 3, label: '3 números\n1+2+3' },
      { value: 4, label: '4 números\n1+2+3+4' },
      { value: 5, label: '5 números\n1+2+3+4+5' },
    ]
    const twoOpts = [
      { value: 1, label: '1 dígito\n(1-9)' },
      { value: 2, label: '2 dígitos\n(10-99)' },
    ]

    return `
      <div class="sset-root">
        <header class="sset-header">
          <span class="sset-title">⚙ CONFIGURACIÓN</span>
          <button class="btn sset-back" id="ssetBack">← VOLVER</button>
        </header>

        <div class="sset-body">

          <!-- Timer -->
          <section class="sset-section">
            <div class="sset-label">⏱ TIEMPO POR PREGUNTA</div>
            <div class="timer-row" id="timerRow">${timerBtns}</div>
          </section>

          <!-- Suma: dos configuraciones independientes -->
          <section class="sset-section">
            <div class="sset-label">+ SUMA — tamaño de cada número</div>
            ${this.levelBtns('addOperandLevel', addOperandOpts, w.additionOperandDigits)}
            <div class="sset-label" style="margin-top:8px;">Cantidad de números a sumar</div>
            ${this.levelBtns('addCountLevel', addCountOpts, w.additionNumAddends)}
          </section>

          <!-- Resta -->
          <section class="sset-section">
            <div class="sset-label">− RESTA — tamaño de los números</div>
            ${this.levelBtns('subLevel', twoOpts, w.subtractionDigits)}
          </section>

          <!-- Multiplicación + tablas 1-9 -->
          <section class="sset-section">
            <div class="sset-label">× MULTIPLICACIÓN — elige las tablas (1-9)</div>
            <div class="sset-sub">La tabla es el primer número: <b>5</b> × 1, 2, 3...</div>
            <div class="sset-hint" id="tableHint">Selecciona al menos una</div>
            <div class="table-grid" id="tableGrid">${tableBtns}</div>
          </section>

          <!-- División (usa las mismas tablas de multiplicación) -->
          <section class="sset-section">
            <div class="sset-label">÷ DIVISIÓN</div>
            <div class="sset-sub">Usa las mismas tablas seleccionadas en multiplicación</div>
          </section>

          <!-- Sonido -->
          <section class="sset-section">
            <div class="sset-label">🔊 SONIDO</div>
            <div class="mute-row">
              <button class="mute-btn${!muteSel ? ' mute-btn--sel' : ''}" id="muteOn"  data-mute="false">🔊 ACTIVADO</button>
              <button class="mute-btn${muteSel  ? ' mute-btn--sel' : ''}" id="muteOff" data-mute="true">🔇 SILENCIO</button>
            </div>
          </section>

        </div>

        <div class="sset-footer">
          <button class="btn btn--accent sset-save" id="ssetSave">💾 GUARDAR</button>
        </div>
      </div>`
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  private attachStyles(container: HTMLElement): void {
    const s = document.createElement('style')
    s.textContent = `
      .ss-root { width:100%; height:100%; position:relative; overflow:hidden; }
      .ss-phase {
        position:absolute; inset:0;
        display:flex; align-items:center; justify-content:center;
        transition:opacity 200ms ease;
      }
      .ss-phase--hidden { opacity:0; pointer-events:none; }

      /* ── PIN ──────────────────────────────────────────────── */
      .pin-card {
        display:flex; flex-direction:column; align-items:center;
        gap:12px; padding:24px 20px;
        background:#0d0d22; border:3px solid #4a4a8a;
        box-shadow:6px 6px 0 #000;
        max-width:320px; width:90%;
      }
      .pin-icon  { font-size:32px; }
      .pin-title {
        font-family:'Courier New',monospace; font-size:20px;
        font-weight:900; color:#f0c040; letter-spacing:3px;
      }
      .pin-sub   { font-family:'Courier New',monospace; font-size:12px; color:#6060a0; }

      .pin-display {
        display:flex; gap:10px; padding:8px 16px;
        background:#06060f; border:2px solid #2a2a5a;
      }
      .pin-dot {
        width:16px; height:16px; border-radius:50%;
        border:2px solid #4a4a8a;
        background:transparent;
        transition:background 100ms, border-color 100ms;
      }
      .pin-dot--filled  { background:#f0c040; border-color:#f0c040; }
      .pin-dot--correct { background:#40d060; border-color:#40d060; }

      .pin-error {
        font-family:'Courier New',monospace; font-size:13px;
        color:#d04040; min-height:18px; opacity:0;
        transition:opacity 150ms;
      }
      .pin-error--show { opacity:1; }
      @keyframes pinShake {
        0%,100% { transform:translateX(0); }
        20%      { transform:translateX(-8px); }
        40%      { transform:translateX(8px); }
        60%      { transform:translateX(-6px); }
        80%      { transform:translateX(6px); }
      }
      .pin-display--shake { animation:pinShake 350ms ease; }

      .pin-pad {
        display:grid; grid-template-columns:repeat(3,1fr);
        gap:6px; width:100%;
      }
      .pin-key {
        font-family:'Courier New',monospace; font-size:22px; font-weight:bold;
        color:#e8e8f0; background:#1a1a3a; border:2px solid #3a3a6a;
        padding:12px 0; cursor:pointer; text-align:center;
        transition:background 80ms, transform 80ms;
        min-height:52px;
        -webkit-tap-highlight-color:transparent;
      }
      .pin-key:active  { background:#2a2a5a; transform:scale(0.94); }
      .pin-key--action { color:#f0c040; background:#12122a; }
      .pin-key--action:active { background:#22224a; }

      .pin-cancel { width:100%; font-size:14px; padding:10px; margin-top:4px; }

      /* ── Settings ─────────────────────────────────────────── */
      .sset-root {
        width:100%; height:100%; display:flex; flex-direction:column;
        background:var(--color-bg);
      }
      .sset-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:8px 12px; background:#0d0d22;
        border-bottom:3px solid #2a2a5a; flex-shrink:0;
      }
      .sset-title {
        font-family:'Courier New',monospace; font-size:clamp(14px,2.5vw,20px);
        font-weight:900; color:#f0c040; letter-spacing:2px;
      }
      .sset-back { font-size:13px; padding:6px 12px; min-height:36px; }

      .sset-body {
        flex:1; overflow-y:auto; padding:12px;
        display:flex; flex-direction:column; gap:16px;
      }
      /* Landscape: two-column layout */
      @media (min-aspect-ratio:1/1) {
        .sset-body {
          display:grid; grid-template-columns:1fr 1fr; gap:12px;
          align-content:start;
        }
        .sset-section:last-child { grid-column:1/-1; }
      }

      .sset-section {
        display:flex; flex-direction:column; gap:8px;
        background:#0d0d22; border:2px solid #2a2a5a; padding:12px;
      }
      .sset-label {
        font-family:'Courier New',monospace; font-size:clamp(10px,1.8vw,13px);
        color:#8080c0; letter-spacing:2px;
      }
      .sset-sub {
        font-family:'Courier New',monospace; font-size:10px;
        color:#6060a0; letter-spacing:0.5px; line-height:1.4;
      }
      .sset-hint {
        font-family:'Courier New',monospace; font-size:11px;
        color:#d04040; min-height:14px; opacity:0; transition:opacity 200ms;
      }
      .sset-hint--show { opacity:1; }

      /* Timer */
      .timer-row { display:flex; gap:8px; }
      .timer-btn {
        flex:1; font-family:'Courier New',monospace; font-size:clamp(14px,2.5vw,20px);
        font-weight:bold; padding:10px 0; cursor:pointer;
        background:#0d0d22; border:3px solid #3a3a6a; color:#6060a0;
        transition:background 80ms, border-color 80ms, color 80ms;
        min-height:48px; -webkit-tap-highlight-color:transparent;
      }
      .timer-btn--sel {
        background:#1a1500; border-color:#f0c040; color:#f0c040;
        box-shadow:0 0 8px #f0c04044;
      }

      /* Level buttons (digit difficulty) */
      .level-row { display:flex; gap:6px; flex-wrap:wrap; }
      .level-btn {
        flex:1; min-width:60px;
        font-family:'Courier New',monospace; font-size:clamp(9px,1.6vw,12px);
        font-weight:bold; padding:7px 4px; cursor:pointer; text-align:center;
        background:#0d0d22; border:2px solid #3a3a6a; color:#6060a0;
        transition:background 80ms, border-color 80ms, color 80ms;
        min-height:44px; white-space:pre-line; line-height:1.3;
        -webkit-tap-highlight-color:transparent;
      }
      .level-btn--sel {
        background:#0e1e3a; border-color:#4080ff; color:#80b0ff;
        box-shadow:0 0 6px #4080ff44;
      }

      /* Tables grid */
      .table-grid {
        display:grid; grid-template-columns:repeat(6,1fr); gap:4px;
      }
      .table-btn {
        font-family:'Courier New',monospace; font-size:clamp(12px,2vw,16px);
        font-weight:bold; padding:8px 0; cursor:pointer;
        background:#0d0d22; border:2px solid #3a3a6a; color:#6060a0;
        transition:background 80ms, border-color 80ms, color 80ms;
        min-height:40px; -webkit-tap-highlight-color:transparent;
      }
      .table-btn--sel {
        background:#102010; border-color:#40d060; color:#40d060;
      }

      /* Mute */
      .mute-row { display:flex; gap:8px; }
      .mute-btn {
        flex:1; font-family:'Courier New',monospace; font-size:clamp(12px,2vw,15px);
        font-weight:bold; padding:10px 0; cursor:pointer;
        background:#0d0d22; border:3px solid #3a3a6a; color:#6060a0;
        transition:background 80ms, border-color 80ms; min-height:48px;
        -webkit-tap-highlight-color:transparent;
      }
      .mute-btn--sel {
        background:#1a1500; border-color:#f0c040; color:#f0c040;
        box-shadow:0 0 8px #f0c04044;
      }

      .sset-footer {
        padding:10px 12px; background:#0d0d22;
        border-top:3px solid #2a2a5a; flex-shrink:0;
      }
      .sset-save {
        width:100%; font-size:clamp(14px,2.5vw,20px); padding:12px;
      }
    `
    container.appendChild(s)
  }

  // ── PIN events ────────────────────────────────────────────────────────────

  private attachPinEvents(container: HTMLElement): void {
    container.querySelector('#pinCancel')?.addEventListener('click', () =>
      this.navigate(Screen.Home),
    )

    container.querySelectorAll<HTMLElement>('.pin-key').forEach((key) => {
      key.addEventListener('click', () => this.handlePinKey(key.dataset.key ?? '', container))
    })
  }

  private attachKeyboard(): void {
    this.keyboardHandler = (e: KeyboardEvent) => {
      if (!this.container) return
      const pinPhase = this.container.querySelector('#ssPin')
      if (!pinPhase || (pinPhase as HTMLElement).style.pointerEvents === 'none') return
      if (e.key >= '0' && e.key <= '9') this.handlePinKey(e.key, this.container)
      else if (e.key === 'Backspace') this.handlePinKey('back', this.container)
      else if (e.key === 'Enter') this.handlePinKey('ok', this.container)
    }
    window.addEventListener('keydown', this.keyboardHandler)
  }

  private handlePinKey(key: string, container: HTMLElement): void {
    const display = container.querySelector<HTMLElement>('#pinDisplay')!
    const errEl   = container.querySelector<HTMLElement>('#pinError')!

    if (key === 'back') {
      this.pin = this.pin.slice(0, -1)
    } else if (key === 'ok') {
      this.submitPin(container)
      return
    } else if (/^\d$/.test(key) && this.pin.length < 6) {
      this.pin += key
    }

    // Update dots
    for (let i = 0; i < 6; i++) {
      const dot = display.querySelector<HTMLElement>(`#dot${i}`)!
      dot.classList.toggle('pin-dot--filled', i < this.pin.length)
    }

    // Auto-submit when 6 digits entered
    if (this.pin.length === 6) {
      setTimeout(() => this.submitPin(container), 120)
    }

    errEl.classList.remove('pin-error--show')
  }

  private submitPin(container: HTMLElement): void {
    const display = container.querySelector<HTMLElement>('#pinDisplay')!
    const errEl   = container.querySelector<HTMLElement>('#pinError')!

    if (this.pin === CORRECT_PIN) {
      // Flash correct then transition
      display.querySelectorAll('.pin-dot').forEach((d) => {
        d.classList.add('pin-dot--correct')
        d.classList.remove('pin-dot--filled')
      })
      setTimeout(() => this.switchToSettings(container), 300)
    } else {
      // Shake + clear
      display.classList.add('pin-display--shake')
      errEl.classList.add('pin-error--show')
      setTimeout(() => {
        display.classList.remove('pin-display--shake')
        this.pin = ''
        display.querySelectorAll('.pin-dot').forEach((d) => {
          d.classList.remove('pin-dot--filled', 'pin-dot--correct')
        })
      }, 380)
    }
  }

  private switchToSettings(container: HTMLElement): void {
    const pinEl  = container.querySelector<HTMLElement>('#ssPin')!
    const setEl  = container.querySelector<HTMLElement>('#ssSettings')!
    pinEl.classList.add('ss-phase--hidden')
    setEl.classList.remove('ss-phase--hidden')
    this.attachSettingsEvents(container)
  }

  // ── Settings events ───────────────────────────────────────────────────────

  private attachSettingsEvents(container: HTMLElement): void {
    // Back
    container.querySelector('#ssetBack')?.addEventListener('click', () =>
      this.navigate(Screen.Home),
    )

    // Timer
    container.querySelector('#timerRow')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.timer-btn')
      if (!btn) return
      const t = Number(btn.dataset.timer) as TimerDuration
      this.working.timerDuration = t
      container.querySelectorAll('.timer-btn').forEach((b) =>
        b.classList.toggle('timer-btn--sel', (b as HTMLElement).dataset.timer === String(t)),
      )
    })

    // Tables
    container.querySelector('#tableGrid')?.addEventListener('click', (e) => {
      const btn  = (e.target as HTMLElement).closest<HTMLElement>('.table-btn')
      if (!btn) return
      const n    = Number(btn.dataset.table)
      const hint = container.querySelector<HTMLElement>('#tableHint')!

      const isSelected = this.working.multiplicationTables[n]
      if (isSelected) {
        // Guard: at least one must remain
        const selectedCount = Object.values(this.working.multiplicationTables).filter(Boolean).length
        if (selectedCount <= 1) {
          hint.classList.add('sset-hint--show')
          setTimeout(() => hint.classList.remove('sset-hint--show'), 2000)
          return
        }
      }
      this.working.multiplicationTables[n] = !isSelected
      btn.classList.toggle('table-btn--sel', !isSelected)
      hint.classList.remove('sset-hint--show')
    })

    // Level buttons — map group id to settings key
    const levelGroupMap: Record<string, keyof Settings> = {
      addOperandLevel: 'additionOperandDigits',
      addCountLevel:   'additionNumAddends',
      subLevel:        'subtractionDigits',
    }

    container.querySelectorAll<HTMLElement>('.level-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group ?? ''
        const key   = levelGroupMap[group] as keyof Settings
        if (!key) return
        const value = Number(btn.dataset.level)
        ;(this.working as unknown as Record<string, number>)[key] = value
        container.querySelectorAll<HTMLElement>(`.level-btn[data-group="${group}"]`).forEach((b) =>
          b.classList.toggle('level-btn--sel', b === btn),
        )
      })
    })

    // Mute
    container.querySelectorAll<HTMLElement>('.mute-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const muted = btn.dataset.mute === 'true'
        this.working.muted = muted
        container.querySelector('#muteOn')?.classList.toggle('mute-btn--sel',  !muted)
        container.querySelector('#muteOff')?.classList.toggle('mute-btn--sel', muted)
      })
    })

    // Save
    container.querySelector('#ssetSave')?.addEventListener('click', () => {
      this.onSettingsChange(this.working)
      this.navigate(Screen.Home)
    })
  }
}
