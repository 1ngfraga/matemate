import { GameMode, Screen } from "../core/Types";
import { NavigateFn } from "../app/Router";
import { BaseScreen } from "../app/ScreenManager";
import { requestFullscreen } from "../core/Fullscreen";
import { getFlagClass, getLocale, LOCALE_OPTIONS, setLocale, t } from "../i18n/I18n";
import { storage } from "../storage/StorageService";

export class WelcomeScreen implements BaseScreen {
  private container: HTMLElement | null = null;

  constructor(private navigate: NavigateFn) {}

  mount(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.html();
    this.attachEvents(container);
  }

  unmount(): void {
    if (this.container) this.container.innerHTML = "";
    this.container = null;
  }

  // ── HTML ─────────────────────────────────────────────────────────────────

  private html(): string {
    return `
      <div class="wl-root">
        <img class="wl-bg" src="portada.png" alt="">
        <div class="wl-lang">
          <button class="wl-lang-current" id="wlLangCurrent" aria-label="${t("practiceIconLabel")}">
            <span class="wl-flag wl-flag--${getFlagClass(getLocale())}"></span>
          </button>
          <div class="wl-lang-menu wl-lang-menu--hidden" id="wlLangMenu">
            ${LOCALE_OPTIONS.map((option) =>
              `<button class="wl-lang-btn${option.locale === getLocale() ? " wl-lang-btn--sel" : ""}" data-locale="${option.locale}" aria-label="${option.locale}">
                <span class="wl-flag wl-flag--${option.flagClass}"></span>
              </button>`,
            ).join("")}
          </div>
        </div>

        <div class="wl-center">
          <div class="wl-title">
            <span class="wl-t1">MATE</span><span class="wl-t2">MATE</span>
          </div>
          <p class="wl-sub">${t("appSubtitle")}</p>
          <div class="wl-actions">
            <button class="btn btn--accent wl-play" id="wlPlay">▶ &nbsp;${t("modePlay")}</button>
            <button class="btn wl-free" id="wlFree">☺ &nbsp;${t("modePractice")}</button>
          </div>
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
          position:absolute; inset:0;
          width:100%; height:100%;
          object-fit:cover; object-position:center;
          image-rendering:pixelated;
        }
        .wl-center {
          position:relative; z-index:2;
          display:flex; flex-direction:column; align-items:center;
          gap:clamp(10px,2vh,18px); padding:16px;
        }
        .wl-lang {
          position:absolute;
          top:12px;
          right:12px;
          z-index:3;
          display:flex;
          flex-direction:column;
          align-items:flex-end;
          gap:8px;
        }
        .wl-lang-current, .wl-lang-btn {
          width:46px;
          height:46px;
          border:3px solid #ffe080;
          border-radius:50%;
          background:rgba(13,13,34,0.95);
          color:#fff;
          font-size:24px;
          line-height:1;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 0 rgba(0,0,0,0.35);
          transition:transform 80ms ease, border-color 120ms ease, box-shadow 120ms ease;
        }
        .wl-flag {
          display:block;
          width:26px;
          height:26px;
          border-radius:50%;
          overflow:hidden;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,0.15);
          position:relative;
          flex-shrink:0;
        }
        .wl-flag--es {
          background:linear-gradient(to bottom, #c60b1e 0 25%, #ffc400 25% 75%, #c60b1e 75% 100%);
        }
        .wl-flag--gb {
          background:
            linear-gradient(to right, transparent 0 41%, #fff 41% 59%, transparent 59% 100%),
            linear-gradient(to bottom, transparent 0 41%, #fff 41% 59%, transparent 59% 100%),
            linear-gradient(to right, transparent 0 45%, #c8102e 45% 55%, transparent 55% 100%),
            linear-gradient(to bottom, transparent 0 45%, #c8102e 45% 55%, transparent 55% 100%),
            #012169;
        }
        .wl-flag--cn {
          background:#de2910;
        }
        .wl-flag--cn::after {
          content:'★';
          position:absolute;
          left:5px;
          top:2px;
          font-size:11px;
          color:#ffde00;
        }
        .wl-flag--in {
          background:linear-gradient(to bottom, #ff9933 0 33.33%, #fff 33.33% 66.66%, #138808 66.66% 100%);
        }
        .wl-flag--in::after {
          content:'';
          position:absolute;
          inset:10px;
          border:2px solid #000080;
          border-radius:50%;
        }
        .wl-flag--sa {
          background:#006c35;
        }
        .wl-flag--sa::after {
          content:'';
          position:absolute;
          left:5px;
          right:5px;
          top:12px;
          height:2px;
          background:#fff;
          border-radius:2px;
        }
        .wl-flag--fr {
          background:linear-gradient(to right, #0055a4 0 33.33%, #fff 33.33% 66.66%, #ef4135 66.66% 100%);
        }
        .wl-flag--bd {
          background:#006a4e;
        }
        .wl-flag--bd::after {
          content:'';
          position:absolute;
          width:12px;
          height:12px;
          border-radius:50%;
          background:#f42a41;
          left:8px;
          top:7px;
        }
        .wl-flag--br {
          background:#009b3a;
        }
        .wl-flag--br::before {
          content:'';
          position:absolute;
          left:5px;
          top:5px;
          width:16px;
          height:16px;
          background:#ffdf00;
          transform:rotate(45deg);
        }
        .wl-flag--br::after {
          content:'';
          position:absolute;
          width:10px;
          height:10px;
          border-radius:50%;
          background:#002776;
          left:8px;
          top:8px;
        }
        .wl-flag--ru {
          background:linear-gradient(to bottom, #fff 0 33.33%, #0039a6 33.33% 66.66%, #d52b1e 66.66% 100%);
        }
        .wl-flag--jp {
          background:#fff;
        }
        .wl-flag--jp::after {
          content:'';
          position:absolute;
          width:12px;
          height:12px;
          border-radius:50%;
          background:#bc002d;
          left:7px;
          top:7px;
        }
        .wl-flag--globe {
          background:radial-gradient(circle at 30% 30%, #7fd3ff, #1d71b8);
        }
        .wl-lang-current:active, .wl-lang-btn:active {
          transform:translateY(2px);
          box-shadow:0 2px 0 rgba(0,0,0,0.35);
        }
        .wl-lang-menu {
          display:grid;
          grid-template-columns:repeat(5, 1fr);
          gap:8px;
          background:rgba(13,13,34,0.94);
          border:3px solid #4a4a8a;
          border-radius:18px;
          padding:10px;
          width:max-content;
          box-shadow:0 8px 18px rgba(0,0,0,0.3);
        }
        .wl-lang-menu--hidden {
          display:none;
        }
        .wl-lang-btn--sel {
          border-color:#40d060;
          background:#102010;
          box-shadow:0 0 0 3px rgba(64,208,96,0.18);
        }
        .wl-title {
          display:flex; gap:2px;
          filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));
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
        .wl-actions {
          display:flex;
          flex-direction:column;
          gap:10px;
          width:min(320px, 90vw);
        }
        .wl-play, .wl-free {
          font-size:clamp(18px,3.5vw,28px); padding:14px 48px;
          min-width:200px; width:100%;
          animation:wlPulse 2s ease-in-out infinite;
        }
        .wl-play {
          background:#ff8844 !important; border-color:#ffcc44 !important;
          color:#fff !important; box-shadow:4px 4px 0 #cc4400 !important;
        }
        .wl-free {
          background:#3b6ed8 !important; border-color:#9fc2ff !important;
          color:#fff !important; box-shadow:4px 4px 0 #1b3e8f !important;
          animation:none;
        }
        @keyframes wlPulse {
          0%,100%{box-shadow:4px 4px 0 #cc4400,0 0 0 rgba(255,136,68,0)!important}
          50%    {box-shadow:4px 4px 0 #cc4400,0 0 24px rgba(255,200,68,0.6)!important}
        }
        .wl-hint {
          font-size:12px; color:rgba(255,255,255,0.7);
          font-family:'Courier New',monospace; min-height:16px;
        }
      </style>`;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private attachEvents(container: HTMLElement): void {
    const playBtn = container.querySelector<HTMLButtonElement>("#wlPlay")!;
    const freeBtn = container.querySelector<HTMLButtonElement>("#wlFree")!;
    const hint = container.querySelector<HTMLElement>("#wlHint")!;
    const langCurrent = container.querySelector<HTMLButtonElement>("#wlLangCurrent")!;
    const langMenu = container.querySelector<HTMLElement>("#wlLangMenu")!;

    langCurrent.addEventListener("click", () => {
      langMenu.classList.toggle("wl-lang-menu--hidden");
    });
    container.querySelectorAll<HTMLElement>(".wl-lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const locale = btn.dataset.locale as ReturnType<typeof getLocale>;
        setLocale(locale);
        storage.saveLocale(locale);
        container.innerHTML = this.html();
        this.attachEvents(container);
      });
    });

    const startMode = async (btn: HTMLButtonElement, mode: GameMode) => {
      playBtn.disabled = true;
      freeBtn.disabled = true;
      btn.textContent = "...";
      try {
        await requestFullscreen(document.documentElement);
      } catch {
        hint.textContent = "";
      }
      this.navigate(Screen.Home, mode);
    };

    playBtn.addEventListener("click", () => startMode(playBtn, GameMode.Play));
    freeBtn.addEventListener("click", () => startMode(freeBtn, GameMode.Free));
  }
}
