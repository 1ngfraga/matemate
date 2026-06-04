import {
  Animal,
  AnswerChoice,
  GameMode,
  Operation,
  Screen,
  Settings,
} from "../core/Types";
import { NavigateFn } from "../app/Router";
import { ResultScreenParams } from "../app/Router";
import { BaseScreen } from "../app/ScreenManager";
import { QuestionGenerator } from "../math/QuestionGenerator";
import { AnswerGenerator } from "../math/AnswerGenerator";
import { GameState } from "../core/GameState";
import { GameLoop } from "../core/GameLoop";
import { Timer } from "../core/Timer";
import { AnimationController } from "../animation/AnimationController";
import {
  buildStarField,
  StarField,
  drawBackground,
  drawPixelText,
} from "../graphics/PixelArtRenderer";
import { randomObstacleKind } from "../graphics/ObstacleSprites";
import { storage } from "../storage/StorageService";
import { SoundService } from "../audio/SoundService";
import { getAnimalFaceImage } from "../graphics/GameSprites";

const FEEDBACK_MS = 700;
const GRACE_MS = 1000;
const ANS_COLORS = ["#2a3a9a", "#1e2e80", "#2a2080"];
const ANS_CORRECT = "#0e5a28";
const ANS_WRONG = "#6a1414";

type Phase = "question" | "grace" | "feedback" | "done";
type FaceMood = "neutral" | "success" | "hurt";

export class GameScreen implements BaseScreen {
  private container: HTMLElement | null = null;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private dpr = 1;

  private state!: GameState;
  private timer = new Timer();
  private loop = new GameLoop();
  private anim!: AnimationController;
  private starField!: StarField;

  private sound!: SoundService;
  private answers: AnswerChoice[][] = [];
  private phase: Phase = "question";
  private phaseTimer = 0; // ms elapsed in feedback phase
  private scrollX = 0;
  private pickedIdx: number | null = null; // index into current answers[]
  private lastTickSec = -1;
  private graceTriggered = false;
  private streakPulseTimeout: number | null = null;
  private faceMood: FaceMood = "neutral";

  constructor(
    private navigate: NavigateFn,
    private mode: GameMode,
    private settings: Settings,
    private operation: Operation,
  ) {}

  // ── Mount / Unmount ───────────────────────────────────────────────────

  mount(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.html();
    this.attachStyles(container);

    this.canvas = container.querySelector<HTMLCanvasElement>("#gsCanvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.dpr = window.devicePixelRatio || 1;

    this.initGame();
    this.attachEvents(container);
    this.loop.start((dt) => this.tick(dt));
  }

  unmount(): void {
    this.loop.stop();
    if (this.streakPulseTimeout !== null)
      window.clearTimeout(this.streakPulseTimeout);
    if (this.container) this.container.innerHTML = "";
    this.container = null;
  }

  // ── Initialization ────────────────────────────────────────────────────

  private initGame(): void {
    const target = this.settings.gameTargetByOperation[this.operation];
    const questions = QuestionGenerator.generateSession(
      this.operation,
      this.settings,
      target,
    );
    this.answers = questions.map((q) => AnswerGenerator.generate(q));
    this.state = new GameState(this.operation, questions, target);
    this.anim = new AnimationController(this.settings.animal);
    this.starField = buildStarField(800, 300);
    this.sound = new SoundService(this.settings.muted);

    this.resizeCanvas();
    this.startQuestion();
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);
  }

  // ── Question lifecycle ────────────────────────────────────────────────

  private startQuestion(): void {
    if (this.state.isComplete) {
      this.endGame();
      return;
    }
    this.ensureQuestionBuffer();

    this.phase = "question";
    this.phaseTimer = 0;
    this.pickedIdx = null;
    this.lastTickSec = -1;
    this.graceTriggered = false;
    this.faceMood = "neutral";

    // Timer
    const timerSeconds = this.settings.timerByOperation[this.operation];
    this.timer.start(timerSeconds * 1000, GRACE_MS);

    // Obstacle — timed to arrive exactly when question timer hits 0
    const obsKind = randomObstacleKind();
    const rect = this.canvas.getBoundingClientRect();
    const timerMs = timerSeconds * 1000;
    this.anim.spawnObstacle(obsKind, rect.width * 1.06, timerMs);

    // DOM: render question + answers
    this.renderQuestion();
    this.setButtonsEnabled(true);
    this.resetButtonStyles();
    this.updateHUD();
  }

  private onAnswer(choiceIdx: number): void {
    if (this.phase !== "question" && this.phase !== "grace") return;
    this.pickedIdx = choiceIdx;

    const choice = this.answers[this.state.currentIndex][choiceIdx];
    const correct = choice.isCorrect;

    if (correct) {
      this.state.recordCorrect();
      this.sound.playCorrect();
      this.anim.onCorrectAnswer();
      this.faceMood = "success";
      this.bumpStreak(true);
    } else {
      this.state.recordIncorrect();
      this.sound.playWrong();
      this.anim.onWrongAnswer();
      this.faceMood = "hurt";
      this.bumpStreak(false);
    }

    this.showFeedback(correct);
  }

  private onTimerExpired(): void {
    if (this.phase !== "grace") return;
    this.state.recordIncorrect();
    this.sound.playWrong();
    this.anim.onTimeout();
    this.faceMood = "hurt";
    this.bumpStreak(false);
    this.showFeedback(false);
  }

  private showFeedback(correct: boolean): void {
    this.phase = "feedback";
    this.phaseTimer = 0;
    this.timer.stop();
    this.setButtonsEnabled(false);
    this.colorButtons(correct);
    this.updateHUD();
  }

  private endGame(): void {
    this.phase = "done";
    this.loop.stop();
    const result = this.state.buildResult();
    storage.saveResult(this.mode, result);
    this.sound.playVictory();
    const params: ResultScreenParams = {
      result,
      mode: this.mode,
      animal: this.settings.animal,
    };
    setTimeout(() => this.navigate(Screen.Result, params), 700);
  }

  private ensureQuestionBuffer(): void {
    const needIndex = this.state.currentIndex;
    while (this.answers.length <= needIndex + 2) {
      const extra = QuestionGenerator.generateSession(
        this.operation,
        this.settings,
        this.state.targetStreak,
      );
      this.state.appendQuestions(extra);
      this.answers.push(...extra.map((q) => AnswerGenerator.generate(q)));
    }
  }

  private bumpStreak(correct: boolean): void {
    if (!this.container) return;
    const el = this.container.querySelector<HTMLElement>("#gsStreakVal");
    if (!el) return;
    el.classList.remove("gs-streak-val--pulse", "gs-streak-val--reset");
    void el.offsetWidth;
    el.classList.add(correct ? "gs-streak-val--pulse" : "gs-streak-val--reset");
    if (this.streakPulseTimeout !== null)
      window.clearTimeout(this.streakPulseTimeout);
    this.streakPulseTimeout = window.setTimeout(() => {
      el.classList.remove("gs-streak-val--pulse", "gs-streak-val--reset");
      this.streakPulseTimeout = null;
    }, 320);
    this.renderFace();
  }

  // ── Main loop tick ────────────────────────────────────────────────────

  private tick(dt: number): void {
    if (!this.container) return;

    // Phase logic
    switch (this.phase) {
      case "question": {
        this.timer.update(dt);
        // Tick sound for last 3 seconds
        const secs = this.timer.displaySeconds;
        if (secs <= 3 && secs > 0 && secs !== this.lastTickSec) {
          this.lastTickSec = secs;
          this.sound.playTick();
        }
        if (this.timer.isInGrace) {
          this.phase = "grace";
        }
        break;
      }
      case "grace":
        this.timer.update(dt);
        if (!this.graceTriggered) {
          this.graceTriggered = true;
          this.sound.playGrace();
        }
        if (this.timer.isExpired) {
          this.onTimerExpired();
        }
        break;

      case "feedback":
        this.phaseTimer += dt;
        if (this.phaseTimer >= FEEDBACK_MS) {
          this.state.advance();
          this.startQuestion();
        }
        break;

      case "done":
        break;
    }

    // Scroll synchronized to run cycle: FRAME_MS=150ms, target ~40px per frame
    this.scrollX += dt * 0.267;

    // Render canvas
    this.renderCanvas(dt);

    // Update DOM timer
    this.updateTimerDOM();
  }

  // ── Canvas rendering ──────────────────────────────────────────────────

  private renderCanvas(dt: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    if (W < 1 || H < 1) return;

    // Resize if canvas CSS size changed (orientation change)
    if (
      Math.round(W * this.dpr) !== this.canvas.width ||
      Math.round(H * this.dpr) !== this.canvas.height
    ) {
      this.ctx.resetTransform();
      this.resizeCanvas();
    }

    this.ctx.save();
    drawBackground(this.ctx, W, H, this.scrollX, this.starField);
    this.anim.update(this.ctx, W, H, dt);

    // Score overlay on canvas (top-left corner)
    drawPixelText(
      this.ctx,
      `META ${this.state.targetStreak}`,
      8,
      6,
      12,
      "#8888cc",
    );
    this.ctx.restore();
  }

  // ── DOM updates ───────────────────────────────────────────────────────

  private renderQuestion(): void {
    if (!this.container) return;
    const q = this.state.currentQuestion;
    const choices = this.answers[this.state.currentIndex];

    const qEl = this.container.querySelector<HTMLElement>("#gsQText");
    if (qEl) qEl.textContent = `${q.display} = ?`;

    const btns = this.container.querySelectorAll<HTMLElement>(".gs-ans");
    btns.forEach((btn, i) => {
      btn.textContent = String(choices[i].value);
      btn.dataset.idx = String(i);
    });
  }

  private updateHUD(): void {
    if (!this.container) return;
    const c = this.container;
    const setText = (sel: string, val: string) => {
      const el = c.querySelector<HTMLElement>(sel);
      if (el) el.textContent = val;
    };
    setText("#gsProgress", `META ${this.state.targetStreak}`);
    setText("#gsCorrect", this.state.correctText);
    setText("#gsIncorrect", this.state.incorrectText);
    setText("#gsStreakVal", String(this.state.currentStreak));
    this.renderFace();
  }

  private renderFace(): void {
    if (!this.container) return;
    const canvas = this.container.querySelector<HTMLCanvasElement>("#gsFace");
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const img = getAnimalFaceImage(this.settings.animal as Animal);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!img.complete || img.naturalWidth === 0) return;

    const moodFrame =
      this.faceMood === "success" ? 1 : this.faceMood === "hurt" ? 2 : 0;
    const fw = img.naturalWidth / 3;
    const pad = 2;
    const scale = Math.max(
      1,
      Math.min(
        Math.floor((canvas.width - pad * 2) / fw),
        Math.floor((canvas.height - pad * 2) / img.naturalHeight),
      ),
    );
    const dw = fw * scale;
    const dh = img.naturalHeight * scale;
    const ox = Math.floor((canvas.width - dw) / 2);
    const oy = Math.floor((canvas.height - dh) / 2);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      moodFrame * fw,
      0,
      fw,
      img.naturalHeight,
      ox,
      oy,
      dw,
      dh,
    );
  }

  private updateTimerDOM(): void {
    if (!this.container) return;
    const fill = this.container.querySelector<HTMLElement>("#gsTimerFill");
    const num = this.container.querySelector<HTMLElement>("#gsTimerNum");
    if (!fill || !num) return;

    const frac = this.timer.fraction;
    const grace = this.timer.isInGrace;
    const secs = this.timer.displaySeconds;

    fill.style.width = `${frac * 100}%`;
    fill.style.background = grace
      ? "#f0c040"
      : frac > 0.5
        ? "#40d060"
        : frac > 0.25
          ? "#f0c040"
          : "#d04040";

    num.textContent = grace ? "⚡" : String(secs);
    num.style.color = grace ? "#f0c040" : "#e8e8f0";

    // Grace pulse animation
    fill.style.animation = grace
      ? "timerPulse 0.3s ease-in-out infinite alternate"
      : "none";
  }

  // ── Button helpers ────────────────────────────────────────────────────

  private setButtonsEnabled(enabled: boolean): void {
    this.container
      ?.querySelectorAll<HTMLButtonElement>(".gs-ans")
      .forEach((b) => {
        b.disabled = !enabled;
      });
  }

  private resetButtonStyles(): void {
    this.container
      ?.querySelectorAll<HTMLElement>(".gs-ans")
      .forEach((btn, i) => {
        btn.style.background = ANS_COLORS[i % ANS_COLORS.length];
        btn.style.borderColor = "";
        btn.style.color = "#e8e8f0";
        btn.querySelector(".ans-icon")?.remove();
      });
  }

  private colorButtons(playerWasCorrect: boolean): void {
    if (!this.container) return;
    const choices = this.answers[this.state.currentIndex];
    const btns = this.container.querySelectorAll<HTMLElement>(".gs-ans");

    btns.forEach((btn, i) => {
      const choice = choices[i];
      if (choice.isCorrect) {
        btn.style.background = ANS_CORRECT;
        btn.style.borderColor = "#40d060";
        this.addIcon(btn, "✓");
      } else if (i === this.pickedIdx && !playerWasCorrect) {
        btn.style.background = ANS_WRONG;
        btn.style.borderColor = "#d04040";
        this.addIcon(btn, "✗");
      }
    });
  }

  private addIcon(btn: HTMLElement, icon: string): void {
    const span = document.createElement("span");
    span.className = "ans-icon";
    span.textContent = icon;
    btn.prepend(span);
  }

  // ── HTML ─────────────────────────────────────────────────────────────

  private html(): string {
    return `
      <div class="gs-root">
        <div class="gs-hud">
          <button class="gs-exit-btn" id="gsExit">✕</button>
          <span class="gs-stat" id="gsProgress">META 50</span>
          <div class="gs-timer-wrap">
            <div class="gs-timer-track">
              <div class="gs-timer-fill" id="gsTimerFill" style="width:100%"></div>
            </div>
            <span class="gs-timer-num" id="gsTimerNum">${this.settings.timerByOperation[this.operation]}</span>
          </div>
          <span class="gs-stat gs-correct"   id="gsCorrect">✓ 0</span>
          <span class="gs-stat gs-incorrect" id="gsIncorrect">✗ 0</span>
          <button class="gs-mute-btn" id="gsMute" title="Silencio">
            ${this.settings.muted ? "🔇" : "🔊"}
          </button>
        </div>

        <canvas id="gsCanvas" class="gs-canvas"></canvas>

        <div class="gs-streak-hud">
          <div class="gs-streak-coin">
            <span class="gs-streak-val" id="gsStreakVal">0</span>
            <canvas class="gs-face" id="gsFace" width="42" height="42"></canvas>
          </div>
        </div>

        <div class="gs-question">
          <div class="gs-q-text" id="gsQText">…</div>
        </div>

        <div class="gs-answers" id="gsAnswers">
          <button class="gs-ans" data-idx="0">?</button>
          <button class="gs-ans" data-idx="1">?</button>
          <button class="gs-ans" data-idx="2">?</button>
        </div>
      </div>`;
  }

  // ── Events ────────────────────────────────────────────────────────────

  private attachEvents(container: HTMLElement): void {
    container.querySelector("#gsExit")?.addEventListener("click", () => {
      this.loop.stop();
      this.navigate(Screen.Home, this.mode);
    });

    container.querySelector("#gsMute")?.addEventListener("click", (e) => {
      const btn = e.currentTarget as HTMLElement;
      const muted = !this.sound.isMuted;
      this.sound.setMuted(muted);
      btn.textContent = muted ? "🔇" : "🔊";
      this.settings = { ...this.settings, muted };
      storage.saveSettings(this.mode, this.settings);
    });

    container.querySelectorAll<HTMLElement>(".gs-ans").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        this.onAnswer(idx);
      });
    });
  }

  // ── Styles ────────────────────────────────────────────────────────────

  private attachStyles(container: HTMLElement): void {
    const s = document.createElement("style");
    s.textContent = `
      .gs-root {
        width:100%; height:100%;
        display:flex; flex-direction:column;
        background:var(--color-bg); overflow-x:auto; overflow-y:hidden;
        position:relative;
      }

      /* HUD */
      .gs-hud {
        display:flex; align-items:center; gap:8px;
        padding:4px 8px; background:#080818;
        border-bottom:2px solid #1e1e40; flex-shrink:0;
        min-height:34px;
      }
      .gs-exit-btn {
        background:#3a0a0a; border:2px solid #8a2020;
        color:#ff6060; font-family:'Courier New',monospace;
        font-size:14px; font-weight:bold;
        padding:4px 8px; cursor:pointer; min-height:28px;
        -webkit-tap-highlight-color:transparent;
      }
      .gs-exit-btn:active { background:#5a1010; }
      .gs-mute-btn {
        background:transparent; border:none; font-size:16px;
        cursor:pointer; padding:2px 4px; line-height:1;
        -webkit-tap-highlight-color:transparent; opacity:0.7;
      }
      .gs-mute-btn:active { opacity:1; }
      .gs-stat {
        font-family:'Courier New',monospace; font-size:12px;
        color:#8888cc; white-space:nowrap;
      }
      .gs-correct   { color:#40d060; }
      .gs-incorrect { color:#d04040; }

      .gs-timer-wrap {
        display:flex; align-items:center; gap:4px; flex:1;
      }
      .gs-timer-track {
        flex:1; height:12px; background:#0a0a1a;
        border:1px solid #2a2a5a; overflow:hidden;
      }
      .gs-timer-fill {
        height:100%; background:#40d060;
        transition:width 80ms linear, background 300ms;
      }
      @keyframes timerPulse {
        from { opacity:0.5; }
        to   { opacity:1; }
      }
      .gs-timer-num {
        font-family:'Courier New',monospace; font-size:13px;
        font-weight:bold; color:#e8e8f0; min-width:20px;
        text-align:center;
      }

      /* Canvas */
      .gs-canvas {
        width:max(100%, 400px); min-width:400px; align-self:center; flex:0 0 auto;
        height:clamp(80px, 32vh, 200px);
        image-rendering:pixelated; display:block;
      }

      .gs-streak-hud {
        position:absolute;
        top:40px;
        right:8px;
        z-index:3;
        pointer-events:none;
      }
      .gs-streak-coin {
        display:flex;
        align-items:center;
        gap:6px;
        padding:5px 8px 5px 10px;
        background:rgba(10,10,26,0.78);
        border:2px solid #2a2a5a;
        border-radius:999px;
        box-shadow:0 3px 0 rgba(0,0,0,0.35);
      }
      .gs-face {
        width:42px;
        height:42px;
        image-rendering:pixelated;
        display:block;
        filter:drop-shadow(1px 2px 0 rgba(0,0,0,0.35));
      }

      /* Question */
      .gs-question {
        display:flex; align-items:center; justify-content:center;
        background:#080818; border-top:2px solid #1e1e40;
        border-bottom:2px solid #1e1e40;
        padding:6px 12px; flex-shrink:0; min-width:400px;
      }
      .gs-streak-val {
        font-family:'Courier New',monospace;
        font-size:clamp(20px, 4vw, 30px);
        font-weight:900;
        color:#f0c040;
        line-height:1;
        text-shadow:2px 2px 0 #5a4200;
        transition:transform 120ms ease, color 120ms ease;
        white-space:nowrap;
      }
      .gs-streak-val--pulse {
        color:#40d060;
        transform:scale(1.12);
      }
      .gs-streak-val--reset {
        color:#d04040;
        transform:scale(0.9);
      }
      .gs-q-text {
        font-family:'Courier New',monospace;
        font-size:clamp(18px, 4.4vw, 34px);
        font-weight:900; color:#f0c040;
        letter-spacing:3px;
        text-shadow:2px 2px 0 #8a6000, 4px 4px 0 #3a2000;
        text-align:center;
      }

      /* Answer buttons */
      .gs-answers {
        display:flex; gap:6px; padding:6px;
        flex:1; min-height:0; min-width:400px;
      }
      .gs-ans {
        flex:1;
        position:relative;
        overflow:hidden;
        font-family:'Courier New',monospace;
        font-size:clamp(20px, 4.5vw, 40px);
        font-weight:900; color:#e8e8f0;
        background:#2a3a9a; border:3px solid #4a5acc;
        cursor:pointer; display:flex;
        align-items:center; justify-content:center;
        gap:6px;
        min-height:clamp(64px, 14vh, 108px);
        padding:10px 14px 12px;
        border-radius:18px;
        box-shadow:
          inset 0 2px 0 rgba(255,255,255,0.14),
          inset 0 -3px 0 rgba(0,0,0,0.16),
          0 4px 0 rgba(28,18,90,0.9),
          0 8px 14px rgba(0,0,0,0.18);
        transition:background 200ms, border-color 200ms, transform 80ms, filter 120ms, box-shadow 80ms;
        -webkit-tap-highlight-color:transparent;
        letter-spacing:1px;
      }
      .gs-ans::before {
        content:'';
        position:absolute;
        left:8px;
        right:8px;
        top:7px;
        height:32%;
        border-radius:12px;
        background:rgba(255,255,255,0.08);
        pointer-events:none;
      }
      .gs-ans:active:not(:disabled) {
        transform:translateY(3px);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.12),
          inset 0 -2px 0 rgba(0,0,0,0.16),
          0 1px 0 rgba(28,18,90,0.9),
          0 4px 8px rgba(0,0,0,0.16);
      }
      .gs-ans:hover:not(:disabled) { filter:brightness(1.05); }
      .gs-ans:disabled { opacity:0.92; cursor:default; }
      .ans-icon {
        position:relative;
        z-index:1;
        font-size:0.7em;
      }
    `;
    container.appendChild(s);
  }
}
