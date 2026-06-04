import {
  AdditionNumAddends,
  AdditionOperandDigits,
  GameMode,
  Operation,
  Screen,
  Settings,
  SubtractionDigits,
  TimerDuration,
} from "../core/Types";
import { NavigateFn } from "../app/Router";
import { BaseScreen } from "../app/ScreenManager";
import { storage } from "../storage/StorageService";
import { t } from "../i18n/I18n";

const TIMERS: TimerDuration[] = [
  TimerDuration.Short,
  TimerDuration.Medium,
  TimerDuration.Long,
  TimerDuration.XLong,
  TimerDuration.XXLong,
  TimerDuration.Mega,
];
const TIMER_LABELS: Record<TimerDuration, string> = {
  [TimerDuration.Short]: "5s",
  [TimerDuration.Medium]: "10s",
  [TimerDuration.Long]: "15s",
  [TimerDuration.XLong]: "20s",
  [TimerDuration.XXLong]: "25s",
  [TimerDuration.Mega]: "30s",
};

function progressSignature(settings: Settings): string {
  return JSON.stringify({
    timerByOperation: settings.timerByOperation,
    multiplicationTables: settings.multiplicationTables,
    divisionTables: settings.divisionTables,
    gameTargetByOperation: settings.gameTargetByOperation,
    additionOperandDigits: settings.additionOperandDigits,
    additionNumAddends: settings.additionNumAddends,
    subtractionDigits: settings.subtractionDigits,
  });
}

export class SettingsScreen implements BaseScreen {
  private container: HTMLElement | null = null;
  private pin = "";
  private working!: Settings;
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  private pinMode: "enter" | "create" = "enter";

  constructor(
    private navigate: NavigateFn,
    private mode: GameMode,
    private settings: Settings,
    private onSettingsChange: (mode: GameMode, s: Settings) => void,
  ) {}

  mount(container: HTMLElement): void {
    this.container = container;
    this.working = structuredClone(this.settings);
    this.pin = "";
    this.pinMode = this.mode === GameMode.Play && !storage.loadPin() ? "create" : "enter";
    container.innerHTML = this.html();
    this.attachStyles(container);
    if (this.mode === GameMode.Play) {
      this.attachPinEvents(container);
      this.attachKeyboard();
    } else {
      this.attachSettingsEvents(container);
    }
  }

  unmount(): void {
    if (this.keyboardHandler) {
      window.removeEventListener("keydown", this.keyboardHandler);
      this.keyboardHandler = null;
    }
    if (this.container) this.container.innerHTML = "";
    this.container = null;
  }

  private html(): string {
    const needsPin = this.mode === GameMode.Play;
    return `
      <div class="ss-root">
        ${needsPin ? `
          <div class="ss-phase${this.mode === GameMode.Free ? " ss-phase--hidden" : ""}" id="ssPin">
            <div class="pin-card">
              <button class="pin-close" id="pinCancel" aria-label="Cancelar">×</button>
              <p class="pin-title">${this.pinMode === "create" ? t("pinCreateTitle") : t("pinEnterTitle")}</p>
              <p class="pin-sub">${this.pinMode === "create" ? t("pinCreateSub") : t("pinEnterSub")}</p>

              <div class="pin-display" id="pinDisplay">
                ${Array.from({ length: 6 }, (_, i) => `<div class="pin-dot" id="dot${i}"></div>`).join("")}
              </div>

              <div class="pin-error" id="pinError">
                ${this.pinMode === "create" ? t("pinCreateError") : t("pinEnterError")}
              </div>

              <div class="pin-pad">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="pin-key" data-key="${n}">${n}</button>`).join("")}
                <button class="pin-key pin-key--action" data-key="back">⌫</button>
                <button class="pin-key" data-key="0">0</button>
                <button class="pin-key pin-key--action" data-key="ok">✓</button>
              </div>

              ${this.pinMode === "enter" ? `<button class="pin-reset-link" id="pinReset">${t("pinReset")}</button>` : ""}
            </div>
          </div>
        ` : ""}

        <div class="ss-phase${needsPin ? " ss-phase--hidden" : ""}" id="ssSettings">
          ${this.settingsHtml()}
        </div>
      </div>`;
  }

  private levelBtns(
    id: string,
    options: Array<{ value: number; label: string }>,
    current: number,
  ): string {
    return (
      `<div class="level-row" id="${id}">` +
      options
        .map(
          ({ value, label }) =>
            `<button class="level-btn${value === current ? " level-btn--sel" : ""}" data-level="${value}" data-group="${id}">${label}</button>`,
        )
        .join("") +
      `</div>`
    );
  }

  private timerBtns(op: Operation): string {
    const current = this.working.timerByOperation[op];
    return `<div class="timer-row" data-timer-group="${op}">` +
      TIMERS.map((t) =>
        `<button class="timer-btn${t === current ? " timer-btn--sel" : ""}" data-timer="${t}" data-timer-op="${op}">${TIMER_LABELS[t]}</button>`,
      ).join("") +
      `</div>`;
  }

  private goalInput(op: Operation): string {
    return `
      <label class="goal-row">
        <span class="goal-label">${t("goalLabel")}</span>
        <input class="goal-input" data-goal-op="${op}" type="number" min="1" max="200" step="1"
          value="${this.working.gameTargetByOperation[op]}">
      </label>`;
  }

  private settingsHtml(): string {
    const w = this.working;
    const multiplicationTableBtns = Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      const sel = w.multiplicationTables[n];
      return `<button class="table-btn${sel ? " table-btn--sel" : ""}" data-table="${n}">${n}</button>`;
    }).join("");
    const divisionTableBtns = Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      const sel = w.divisionTables[n];
      return `<button class="table-btn${sel ? " table-btn--sel" : ""}" data-table="${n}">${n}</button>`;
    }).join("");

    const addOperandOpts = [
      { value: 1, label: t("levelOneDigit") },
      { value: 2, label: t("levelTwoDigits") },
    ];
    const addCountOpts = [
      { value: 2, label: t("addends2") },
      { value: 3, label: t("addends3") },
      { value: 4, label: t("addends4") },
      { value: 5, label: t("addends5") },
    ];
    const twoOpts = [
      { value: 1, label: t("levelOneDigit") },
      { value: 2, label: t("levelTwoDigits") },
    ];

    return `
      <div class="sset-root">
        <header class="sset-header">
          <span class="sset-title">⚙ ${this.mode === GameMode.Play ? t("settingsTitlePlay") : t("settingsTitlePractice")}</span>
          <button class="btn sset-back" id="ssetBack">← ${t("back")}</button>
        </header>

        <div class="sset-warning">
          ${this.mode === GameMode.Play
            ? t("pinProtected")
            : t("practiceResetWarning")}
        </div>

        <div class="sset-body">
          <section class="sset-section">
            <div class="sset-label">⏱ ${t("additionTimer")}</div>
            ${this.timerBtns(Operation.Addition)}
            ${this.goalInput(Operation.Addition)}
            <div class="sset-label">+ ${t("additionSize")}</div>
            ${this.levelBtns("addOperandLevel", addOperandOpts, w.additionOperandDigits)}
            <div class="sset-label" style="margin-top:8px;">${t("additionCount")}</div>
            ${this.levelBtns("addCountLevel", addCountOpts, w.additionNumAddends)}
          </section>

          <section class="sset-section">
            <div class="sset-label">⏱ ${t("subtractionTimer")}</div>
            ${this.timerBtns(Operation.Subtraction)}
            ${this.goalInput(Operation.Subtraction)}
            <div class="sset-label">− ${t("subtractionSize")}</div>
            ${this.levelBtns("subLevel", twoOpts, w.subtractionDigits)}
          </section>

          <section class="sset-section">
            <div class="sset-label">⏱ ${t("multiplicationTimer")}</div>
            ${this.timerBtns(Operation.Multiplication)}
            ${this.goalInput(Operation.Multiplication)}
            <div class="sset-label">× ${t("multiplicationTables")}</div>
            <div class="sset-sub">${t("multiplicationHelp")}</div>
            <div class="sset-hint" id="tableHintMultiplication">${t("tableHint")}</div>
            <div class="table-grid" id="tableGridMultiplication" data-table-group="multiplicationTables">${multiplicationTableBtns}</div>
          </section>

          <section class="sset-section">
            <div class="sset-label">⏱ ${t("divisionTimer")}</div>
            ${this.timerBtns(Operation.Division)}
            ${this.goalInput(Operation.Division)}
            <div class="sset-label">÷ ${t("divisionTables")}</div>
            <div class="sset-sub">${t("divisionHelp")}</div>
            <div class="sset-hint" id="tableHintDivision">${t("tableHint")}</div>
            <div class="table-grid" id="tableGridDivision" data-table-group="divisionTables">${divisionTableBtns}</div>
          </section>

          <section class="sset-section">
            <div class="sset-label">🔊 ${t("sound")}</div>
            <div class="mute-row">
              <button class="mute-btn${!w.muted ? " mute-btn--sel" : ""}" id="muteOn" data-mute="false">🔊 ${t("soundOn")}</button>
              <button class="mute-btn${w.muted ? " mute-btn--sel" : ""}" id="muteOff" data-mute="true">🔇 ${t("soundOff")}</button>
            </div>
          </section>
        </div>

        <div class="sset-footer">
          <button class="btn btn--accent sset-save" id="ssetSave">💾 ${t("save")}</button>
        </div>
      </div>`;
  }

  private attachStyles(container: HTMLElement): void {
    const s = document.createElement("style");
    s.textContent = `
      .ss-root { width:100%; height:100%; position:relative; overflow:auto; }
      .ss-phase {
        position:absolute; inset:0;
        display:flex; align-items:center; justify-content:center;
        overflow:auto;
        padding:16px;
        transition:opacity 200ms ease;
      }
      .ss-phase--hidden { opacity:0; pointer-events:none; }
      .pin-card {
        position:relative;
        display:flex; flex-direction:column; align-items:center;
        gap:12px; padding:12px 10px;
        background:#0d0d22; border:3px solid #4a4a8a;
        box-shadow:6px 6px 0 #000;
        max-width:320px; width:90%;
        margin:auto;
      }
      .pin-close {
        position:absolute;
        top:8px;
        left:8px;
        width:28px;
        height:28px;
        display:flex;
        align-items:center;
        justify-content:center;
        border:2px solid #4a5acc;
        background:#1a1a3a;
        color:#e8e8f0;
        font-family:'Courier New',monospace;
        font-size:18px;
        font-weight:900;
        cursor:pointer;
      }
      .pin-title {
        font-family:'Courier New',monospace; font-size:20px;
        font-weight:900; color:#f0c040; letter-spacing:2px;
      }
      .pin-sub { font-family:'Courier New',monospace; font-size:12px; color:#6060a0; text-align:center; }
      .pin-display {
        display:flex; gap:10px; padding:8px 16px;
        background:#06060f; border:2px solid #2a2a5a;
      }
      .pin-dot {
        width:16px; height:16px; border-radius:50%;
        border:2px solid #4a4a8a; background:transparent;
      }
      .pin-dot--filled { background:#f0c040; border-color:#f0c040; }
      .pin-dot--correct { background:#40d060; border-color:#40d060; }
      .pin-error {
        font-family:'Courier New',monospace; font-size:13px;
        color:#d04040; min-height:18px; opacity:0;
        transition:opacity 150ms;
      }
      .pin-error--show { opacity:1; }
      @keyframes pinShake {
        0%,100% { transform:translateX(0); }
        20% { transform:translateX(-8px); }
        40% { transform:translateX(8px); }
        60% { transform:translateX(-6px); }
        80% { transform:translateX(6px); }
      }
      .pin-display--shake { animation:pinShake 350ms ease; }
      .pin-pad {
        display:grid; grid-template-columns:repeat(3,1fr);
        gap:6px; width:100%;
      }
      .pin-key {
        font-family:'Courier New',monospace; font-size:22px; font-weight:bold;
        color:#e8e8f0; background:#1a1a3a; border:2px solid #3a3a6a;
        cursor:pointer; min-height:35px;
      }
      .pin-key--action { color:#f0c040; background:#12122a; }
      .pin-reset-link {
        border:none;
        background:transparent;
        color:#a0a0d0;
        font-family:'Courier New',monospace;
        font-size:11px;
        text-decoration:underline;
        cursor:pointer;
      }
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
      .sset-warning {
        font-family:'Courier New',monospace;
        font-size:11px;
        color:#ffb060;
        background:#2b1600;
        border-bottom:2px solid #7a4b00;
        padding:8px 12px;
      }
      .sset-back { font-size:13px; padding:6px 12px; min-height:36px; }
      .sset-body {
        flex:1; overflow-y:auto; padding:12px;
        display:flex; flex-direction:column; gap:16px;
      }
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
        color:#6060a0; line-height:1.4;
      }
      .sset-hint {
        font-family:'Courier New',monospace; font-size:11px;
        color:#d04040; min-height:14px; opacity:0; transition:opacity 200ms;
      }
      .sset-hint--show { opacity:1; }
      .goal-row {
        display:grid;
        grid-template-columns:minmax(0,1fr) 84px;
        align-items:center;
        gap:8px;
      }
      .goal-label {
        font-family:'Courier New',monospace;
        font-size:clamp(10px,1.8vw,13px);
        color:#a0a0d0;
      }
      .goal-input {
        width:100%; font-family:'Courier New',monospace;
        font-size:16px; font-weight:bold; color:#f0c040;
        background:#06060f; border:2px solid #3a3a6a;
        padding:8px 10px; min-height:40px;
      }
      .timer-row { display:grid; grid-template-columns:repeat(6, minmax(0,1fr)); gap:6px; }
      .timer-btn, .mute-btn {
        font-family:'Courier New',monospace; font-weight:bold;
        background:#0d0d22; border:3px solid #3a3a6a; color:#6060a0;
        min-height:48px; cursor:pointer;
      }
      .timer-btn { font-size:clamp(14px,2.5vw,20px); padding:10px 0; }
      .timer-btn--sel, .mute-btn--sel {
        background:#1a1500; border-color:#f0c040; color:#f0c040;
        box-shadow:0 0 8px #f0c04044;
      }
      .level-row { display:flex; gap:6px; flex-wrap:wrap; }
      .level-btn {
        flex:1; min-width:60px; min-height:44px; white-space:pre-line;
        font-family:'Courier New',monospace; font-size:clamp(9px,1.6vw,12px);
        font-weight:bold; padding:7px 4px; cursor:pointer; text-align:center;
        background:#0d0d22; border:2px solid #3a3a6a; color:#6060a0;
      }
      .level-btn--sel {
        background:#0e1e3a; border-color:#4080ff; color:#80b0ff;
        box-shadow:0 0 6px #4080ff44;
      }
      .table-grid {
        display:grid; grid-template-columns:repeat(6,1fr); gap:4px;
      }
      .table-btn {
        font-family:'Courier New',monospace; font-size:clamp(12px,2vw,16px);
        font-weight:bold; padding:8px 0; cursor:pointer;
        background:#0d0d22; border:2px solid #3a3a6a; color:#6060a0;
        min-height:40px;
      }
      .table-btn--sel { background:#102010; border-color:#40d060; color:#40d060; }
      .mute-row { display:flex; gap:8px; }
      .mute-btn { flex:1; font-size:clamp(12px,2vw,15px); padding:10px 0; }
      .sset-footer {
        padding:10px 12px; background:#0d0d22;
        border-top:3px solid #2a2a5a; flex-shrink:0;
      }
      .sset-save {
        width:100%; font-size:clamp(14px,2.5vw,20px); padding:12px;
      }
    `;
    container.appendChild(s);
  }

  private attachPinEvents(container: HTMLElement): void {
    container.querySelector("#pinCancel")?.addEventListener("click", () => this.navigate(Screen.Home, this.mode));
    container.querySelector("#pinReset")?.addEventListener("click", () => this.resetPinAndProgress());
    container.querySelectorAll<HTMLElement>(".pin-key").forEach((key) => {
      key.addEventListener("click", () => this.handlePinKey(key.dataset.key ?? "", container));
    });
  }

  private attachKeyboard(): void {
    this.keyboardHandler = (e: KeyboardEvent) => {
      if (!this.container) return;
      const pinPhase = this.container.querySelector<HTMLElement>("#ssPin");
      if (!pinPhase || pinPhase.classList.contains("ss-phase--hidden")) return;
      if (e.key >= "0" && e.key <= "9") this.handlePinKey(e.key, this.container);
      else if (e.key === "Backspace") this.handlePinKey("back", this.container);
      else if (e.key === "Enter") this.handlePinKey("ok", this.container);
    };
    window.addEventListener("keydown", this.keyboardHandler);
  }

  private handlePinKey(key: string, container: HTMLElement): void {
    const display = container.querySelector<HTMLElement>("#pinDisplay")!;
    const errEl = container.querySelector<HTMLElement>("#pinError")!;
    if (key === "back") this.pin = this.pin.slice(0, -1);
    else if (key === "ok") {
      this.submitPin(container);
      return;
    } else if (/^\d$/.test(key) && this.pin.length < 6) {
      this.pin += key;
    }

    for (let i = 0; i < 6; i++) {
      const dot = display.querySelector<HTMLElement>(`#dot${i}`)!;
      dot.classList.toggle("pin-dot--filled", i < this.pin.length);
    }

    if (this.pin.length === 6) setTimeout(() => this.submitPin(container), 120);
    errEl.classList.remove("pin-error--show");
  }

  private submitPin(container: HTMLElement): void {
    const display = container.querySelector<HTMLElement>("#pinDisplay")!;
    const errEl = container.querySelector<HTMLElement>("#pinError")!;
    const storedPin = storage.loadPin();

    if (this.pinMode === "create") {
      if (this.pin.length !== 6) {
        errEl.classList.add("pin-error--show");
        return;
      }
      storage.savePin(this.pin);
      display.querySelectorAll(".pin-dot").forEach((d) => d.classList.add("pin-dot--correct"));
      setTimeout(() => this.switchToSettings(container), 250);
      return;
    }

    if (this.pin === storedPin) {
      display.querySelectorAll(".pin-dot").forEach((d) => {
        d.classList.add("pin-dot--correct");
        d.classList.remove("pin-dot--filled");
      });
      setTimeout(() => this.switchToSettings(container), 300);
    } else {
      display.classList.add("pin-display--shake");
      errEl.classList.add("pin-error--show");
      setTimeout(() => {
        display.classList.remove("pin-display--shake");
        this.pin = "";
        display.querySelectorAll(".pin-dot").forEach((d) => {
          d.classList.remove("pin-dot--filled", "pin-dot--correct");
        });
      }, 380);
    }
  }

  private switchToSettings(container: HTMLElement): void {
    const pinEl = container.querySelector<HTMLElement>("#ssPin");
    const setEl = container.querySelector<HTMLElement>("#ssSettings")!;
    pinEl?.classList.add("ss-phase--hidden");
    setEl.classList.remove("ss-phase--hidden");
    this.attachSettingsEvents(container);
  }

  private resetPinAndProgress(): void {
    const confirmed = window.confirm(
      t("pinResetConfirm"),
    );
    if (!confirmed) return;
    storage.resetAllProgress();
    this.navigate(Screen.Welcome);
  }

  private attachSettingsEvents(container: HTMLElement): void {
    container.querySelector("#ssetBack")?.addEventListener("click", () => this.navigate(Screen.Home, this.mode));

    container.querySelectorAll<HTMLElement>(".timer-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const op = btn.dataset.timerOp as Operation;
        const t = Number(btn.dataset.timer) as TimerDuration;
        this.working.timerByOperation[op] = t;
        container
          .querySelectorAll<HTMLElement>(`.timer-btn[data-timer-op="${op}"]`)
          .forEach((b) => b.classList.toggle("timer-btn--sel", b === btn));
      });
    });

    container.querySelectorAll<HTMLElement>(".table-grid").forEach((grid) => {
      grid.addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>(".table-btn");
        if (!btn) return;
        const group = grid.dataset.tableGroup as "multiplicationTables" | "divisionTables";
        const n = Number(btn.dataset.table);
        const hintId = group === "multiplicationTables" ? "#tableHintMultiplication" : "#tableHintDivision";
        const hint = container.querySelector<HTMLElement>(hintId)!;
        const tableMap = this.working[group];
        const isSelected = tableMap[n];
        if (isSelected) {
          const count = Object.values(tableMap).filter(Boolean).length;
          if (count <= 1) {
            hint.classList.add("sset-hint--show");
            setTimeout(() => hint.classList.remove("sset-hint--show"), 2000);
            return;
          }
        }
        tableMap[n] = !isSelected;
        btn.classList.toggle("table-btn--sel", !isSelected);
        hint.classList.remove("sset-hint--show");
      });
    });

    const levelGroupMap: Record<string, keyof Settings> = {
      addOperandLevel: "additionOperandDigits",
      addCountLevel: "additionNumAddends",
      subLevel: "subtractionDigits",
    };

    container.querySelectorAll<HTMLElement>(".level-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.dataset.group ?? "";
        const key = levelGroupMap[group];
        if (!key) return;
        const value = Number(btn.dataset.level);
        (this.working as unknown as Record<string, number>)[key] = value;
        container
          .querySelectorAll<HTMLElement>(`.level-btn[data-group="${group}"]`)
          .forEach((b) => b.classList.toggle("level-btn--sel", b === btn));
      });
    });

    container.querySelectorAll<HTMLElement>(".mute-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const muted = btn.dataset.mute === "true";
        this.working.muted = muted;
        container.querySelector("#muteOn")?.classList.toggle("mute-btn--sel", !muted);
        container.querySelector("#muteOff")?.classList.toggle("mute-btn--sel", muted);
      });
    });

    container.querySelectorAll<HTMLInputElement>(".goal-input").forEach((input) => {
      input.addEventListener("change", () => {
        const op = input.dataset.goalOp as Operation;
        const value = Math.max(1, Math.min(200, Math.round(Number(input.value) || 1)));
        input.value = String(value);
        this.working.gameTargetByOperation[op] = value;
      });
    });

    container.querySelector("#ssetSave")?.addEventListener("click", () => {
      const shouldClearResults = progressSignature(this.settings) !== progressSignature(this.working);
      this.onSettingsChange(this.mode, this.working);
      if (shouldClearResults && this.mode === GameMode.Free) storage.clearResults(this.mode);
      this.navigate(Screen.Home, this.mode);
    });
  }
}
