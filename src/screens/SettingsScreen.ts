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
const PIN_LENGTH = 4;

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
  private holdTimeout: number | null = null;
  private holdInterval: number | null = null;

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
    this.clearGoalHold();
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
                ${Array.from({ length: PIN_LENGTH }, (_, i) => `<div class="pin-dot" id="dot${i}"></div>`).join("")}
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
            `<button class="ui-option-btn level-btn${value === current ? " ui-option-btn--selected" : ""}" data-level="${value}" data-group="${id}">${label}</button>`,
        )
        .join("") +
      `</div>`
    );
  }

  private timerBtns(op: Operation): string {
    const current = this.working.timerByOperation[op];
    return `<div class="timer-row" data-timer-group="${op}">` +
      TIMERS.map((t) =>
        `<button class="ui-option-btn timer-btn${t === current ? " ui-option-btn--selected" : ""}" data-timer="${t}" data-timer-op="${op}">${TIMER_LABELS[t]}</button>`,
      ).join("") +
      `</div>`;
  }

  private goalInput(op: Operation): string {
    const value = this.working.gameTargetByOperation[op];
    return `
      <div class="goal-row" data-goal-row="${op}">
        <span class="goal-label">${t("goalLabel")}</span>
        <div class="goal-stepper" data-goal-op="${op}">
          <button class="goal-btn goal-btn--minus" data-goal-step="-1" aria-label="${t("goalLabel")} menos 1">−</button>
          <div class="goal-value" data-goal-value="${op}" aria-live="polite">${value}</div>
          <button class="goal-btn goal-btn--plus" data-goal-step="1" aria-label="${t("goalLabel")} mas 1">+</button>
        </div>
      </div>`;
  }

  private settingsHtml(): string {
    const w = this.working;
    const multiplicationTableBtns = Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      const sel = w.multiplicationTables[n];
      return `<button class="ui-option-btn table-btn${sel ? " ui-option-btn--selected" : ""}" data-table="${n}">${n}</button>`;
    }).join("");
    const divisionTableBtns = Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      const sel = w.divisionTables[n];
      return `<button class="ui-option-btn table-btn${sel ? " ui-option-btn--selected" : ""}" data-table="${n}">${n}</button>`;
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
          <button class="btn nav-back-btn sset-back" id="ssetBack">← ${t("back")}</button>
          <span class="sset-mode-badge">${this.mode === GameMode.Play ? t("modePlayBadge") : t("modePracticeBadge")}</span>
        </header>

        <div class="sset-body">
          <section class="sset-section">
            <div class="sset-section-title">+ ${t("opAddition")}</div>
            <div class="sset-label">⏱ ${t("timePerQuestionLabel")}</div>
            ${this.timerBtns(Operation.Addition)}
            ${this.goalInput(Operation.Addition)}
            <div class="sset-label">${t("numberSizeLabel")}</div>
            ${this.levelBtns("addOperandLevel", addOperandOpts, w.additionOperandDigits)}
            <div class="sset-label" style="margin-top:8px;">${t("quantityLabel")}</div>
            ${this.levelBtns("addCountLevel", addCountOpts, w.additionNumAddends)}
          </section>

          <section class="sset-section">
            <div class="sset-section-title">− ${t("opSubtraction")}</div>
            <div class="sset-label">⏱ ${t("timePerQuestionLabel")}</div>
            ${this.timerBtns(Operation.Subtraction)}
            ${this.goalInput(Operation.Subtraction)}
            <div class="sset-label">${t("numberSizeLabel")}</div>
            ${this.levelBtns("subLevel", twoOpts, w.subtractionDigits)}
          </section>

          <section class="sset-section">
            <div class="sset-section-title">× ${t("opMultiplication")}</div>
            <div class="sset-label">⏱ ${t("timePerQuestionLabel")}</div>
            ${this.timerBtns(Operation.Multiplication)}
            ${this.goalInput(Operation.Multiplication)}
            <div class="sset-label">${t("tablesLabel")}</div>
            <div class="sset-sub">${t("multiplicationHelp")}</div>
            <div class="sset-hint" id="tableHintMultiplication">${t("tableHint")}</div>
            <div class="table-grid" id="tableGridMultiplication" data-table-group="multiplicationTables">${multiplicationTableBtns}</div>
          </section>

          <section class="sset-section">
            <div class="sset-section-title">÷ ${t("opDivision")}</div>
            <div class="sset-label">⏱ ${t("timePerQuestionLabel")}</div>
            ${this.timerBtns(Operation.Division)}
            ${this.goalInput(Operation.Division)}
            <div class="sset-label">${t("tablesLabel")}</div>
            <div class="sset-sub">${t("divisionHelp")}</div>
            <div class="sset-hint" id="tableHintDivision">${t("tableHint")}</div>
            <div class="table-grid" id="tableGridDivision" data-table-group="divisionTables">${divisionTableBtns}</div>
          </section>
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
      .nav-back-btn {
        font-size:14px;
        padding:8px 14px;
        min-height:40px;
        min-width:110px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        line-height:1;
      }
      .sset-mode-badge {
        display:inline-flex;
        align-items:center;
        gap:6px;
        font-family:'Courier New',monospace;
        font-size:11px;
        color:${this.mode === GameMode.Play ? '#f0c040' : '#80b0ff'};
        background:${this.mode === GameMode.Play ? 'rgba(138,96,0,0.12)' : 'rgba(64,96,208,0.12)'};
        border:1px solid ${this.mode === GameMode.Play ? 'rgba(240,192,64,0.22)' : 'rgba(128,176,255,0.22)'};
        padding:4px 8px;
        letter-spacing:1px;
        pointer-events:none;
      }
      .sset-mode-badge::before {
        content:'';
        width:6px;
        height:6px;
        border-radius:999px;
        background:${this.mode === GameMode.Play ? '#f0c040' : '#80b0ff'};
        box-shadow:0 0 6px ${this.mode === GameMode.Play ? 'rgba(240,192,64,0.35)' : 'rgba(128,176,255,0.35)'};
      }
      .sset-body {
        flex:1; overflow-y:auto; padding:12px;
        display:flex; flex-direction:column; gap:16px;
      }
      @media (min-aspect-ratio:1/1) {
        .sset-body {
          display:grid; grid-template-columns:1fr 1fr; gap:12px;
          align-content:start;
        }
      }
      .sset-section {
        display:flex; flex-direction:column; gap:8px;
        background:#0d0d22; border:2px solid #2a2a5a; padding:12px;
      }
      .sset-section-title {
        font-family:'Courier New',monospace; font-size:clamp(18px,2.6vw,22px);
        font-weight:900; color:#f0c040; letter-spacing:2px;
        margin-bottom:2px;
      }
      .sset-label {
        font-family:'Courier New',monospace; font-size:clamp(13px,2vw,16px);
        color:#aeb4ff; letter-spacing:1px;
      }
      .sset-sub {
        font-family:'Courier New',monospace; font-size:12px;
        color:#6060a0; line-height:1.4;
      }
      .sset-hint {
        font-family:'Courier New',monospace; font-size:12px;
        color:#d04040; min-height:14px; opacity:0; transition:opacity 200ms;
      }
      .sset-hint--show { opacity:1; }
      .goal-row {
        display:flex;
        flex-direction:column;
        gap:8px;
      }
      .goal-label {
        font-family:'Courier New',monospace;
        font-size:clamp(13px,2vw,16px);
        color:#aeb4ff;
      }
      .goal-stepper {
        width:min(100%, 360px);
        margin:0 auto;
        padding:6px;
        display:grid;
        grid-template-columns:56px minmax(0, 1fr) 56px;
        gap:0;
        align-items:stretch;
        background:linear-gradient(180deg, #171133 0%, #0a0818 100%);
        border:2px solid #4a4a8a;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -2px 0 rgba(0,0,0,0.35),
          3px 3px 0 rgba(0,0,0,0.45);
        border-radius:18px;
        overflow:hidden;
      }
      .goal-btn, .goal-value {
        min-height:48px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:'Courier New',monospace;
        font-weight:bold;
        border:none;
      }
      .goal-btn {
        font-size:clamp(20px,3vw,24px);
        color:#cfd3ff;
        background:linear-gradient(180deg, #23254a 0%, #161832 100%);
        cursor:pointer;
        user-select:none;
        -webkit-user-select:none;
        touch-action:manipulation;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -2px 0 rgba(0,0,0,0.28);
      }
      .goal-btn:active {
        background:linear-gradient(180deg, #171832 0%, #101226 100%);
        transform:translateY(1px);
      }
      .goal-btn--minus {
        border-right:1px solid rgba(255,255,255,0.08);
      }
      .goal-btn--plus {
        border-left:1px solid rgba(255,255,255,0.08);
      }
      .goal-value {
        font-size:clamp(18px,2.8vw,22px);
        color:#f0c040;
        background:linear-gradient(180deg, #080811 0%, #05050b 100%);
        letter-spacing:2px;
        box-shadow:
          inset 0 0 0 1px rgba(240,192,64,0.08),
          inset 0 2px 10px rgba(0,0,0,0.45);
      }
      .goal-btn--minus {
        color:#ffb0b0;
        background:linear-gradient(180deg, #3a1f2f 0%, #26131d 100%);
      }
      .goal-btn--plus {
        color:#bff5b8;
        background:linear-gradient(180deg, #17361f 0%, #102415 100%);
      }
      @media (max-width: 520px) {
        .goal-stepper {
          width:min(100%, 320px);
          grid-template-columns:48px minmax(0, 1fr) 48px;
        }
      }
      .timer-row { display:grid; grid-template-columns:repeat(6, minmax(0,1fr)); gap:6px; }
      .timer-btn {
        min-height:48px;
      }
      .timer-btn { font-size:clamp(16px,2.5vw,20px); padding:10px 0; }
      .level-row { display:flex; gap:6px; flex-wrap:wrap; }
      .level-btn {
        flex:1; min-width:60px; min-height:44px; white-space:pre-line;
        font-size:clamp(14px,2.1vw,17px);
        padding:7px 4px; text-align:center;
        border-width:2px;
      }
      .table-grid {
        display:grid; grid-template-columns:repeat(6,1fr); gap:4px;
      }
      .table-btn {
        font-size:clamp(15px,2.2vw,18px);
        padding:8px 0;
        min-height:40px;
        border-width:2px;
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
    } else if (/^\d$/.test(key) && this.pin.length < PIN_LENGTH) {
      this.pin += key;
    }

    for (let i = 0; i < PIN_LENGTH; i++) {
      const dot = display.querySelector<HTMLElement>(`#dot${i}`)!;
      dot.classList.toggle("pin-dot--filled", i < this.pin.length);
    }

    if (this.pin.length === PIN_LENGTH) setTimeout(() => this.submitPin(container), 120);
    errEl.classList.remove("pin-error--show");
  }

  private submitPin(container: HTMLElement): void {
    const display = container.querySelector<HTMLElement>("#pinDisplay")!;
    const errEl = container.querySelector<HTMLElement>("#pinError")!;
    const storedPin = storage.loadPin()?.slice(0, PIN_LENGTH) ?? null;

    if (this.pinMode === "create") {
      if (this.pin.length !== PIN_LENGTH) {
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
        this.persistWorkingSettings();
        container
          .querySelectorAll<HTMLElement>(`.timer-btn[data-timer-op="${op}"]`)
          .forEach((b) => b.classList.toggle("ui-option-btn--selected", b === btn));
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
        this.persistWorkingSettings();
        btn.classList.toggle("ui-option-btn--selected", !isSelected);
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
        this.persistWorkingSettings();
        container
          .querySelectorAll<HTMLElement>(`.level-btn[data-group="${group}"]`)
          .forEach((b) => b.classList.toggle("ui-option-btn--selected", b === btn));
      });
    });

    container.querySelectorAll<HTMLElement>(".goal-stepper").forEach((stepper) => {
      const op = stepper.dataset.goalOp as Operation;
      stepper.querySelectorAll<HTMLElement>(".goal-btn").forEach((btn) => {
        const step = Number(btn.dataset.goalStep);
        const start = (e: Event) => {
          e.preventDefault();
          this.adjustGoal(op, step);
          this.beginGoalHold(op, step);
        };
        const stop = () => this.clearGoalHold();
        btn.addEventListener("pointerdown", start);
        btn.addEventListener("pointerup", stop);
        btn.addEventListener("pointerleave", stop);
        btn.addEventListener("pointercancel", stop);
      });
    });
  }

  private adjustGoal(op: Operation, delta: number): void {
    const current = this.working.gameTargetByOperation[op];
    const next = Math.max(1, Math.min(500, current + delta));
    this.working.gameTargetByOperation[op] = next;
    this.persistWorkingSettings();
    this.container
      ?.querySelector<HTMLElement>(`.goal-value[data-goal-value="${op}"]`)
      ?.replaceChildren(document.createTextNode(String(next)));
  }

  private beginGoalHold(op: Operation, step: number): void {
    this.clearGoalHold();
    this.holdTimeout = window.setTimeout(() => {
      this.holdInterval = window.setInterval(() => {
        this.adjustGoal(op, step * 10);
      }, 90);
    }, 250);
  }

  private clearGoalHold(): void {
    if (this.holdTimeout !== null) {
      window.clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
    if (this.holdInterval !== null) {
      window.clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
  }

  private persistWorkingSettings(): void {
    const shouldClearResults = progressSignature(this.settings) !== progressSignature(this.working);
    this.onSettingsChange(this.mode, this.working);
    if (shouldClearResults && this.mode === GameMode.Free) {
      storage.clearResults(this.mode);
    }
    this.settings = structuredClone(this.working);
  }
}
