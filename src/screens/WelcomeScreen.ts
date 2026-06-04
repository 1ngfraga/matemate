import { GameMode, Screen } from "../core/Types";
import { NavigateFn } from "../app/Router";
import { BaseScreen } from "../app/ScreenManager";
import { requestFullscreen } from "../core/Fullscreen";
import { getFlag, getLocale, LOCALE_OPTIONS, setLocale, t } from "../i18n/I18n";
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
          <button class="wl-lang-current" id="wlLangCurrent" aria-label="${t("practiceIconLabel")}">${getFlag(getLocale())}</button>
          <div class="wl-lang-menu wl-lang-menu--hidden" id="wlLangMenu">
            ${LOCALE_OPTIONS.map((option) =>
              `<button class="wl-lang-btn${option.locale === getLocale() ? " wl-lang-btn--sel" : ""}" data-locale="${option.locale}" aria-label="${option.locale}">${option.flag}</button>`,
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
          gap:6px;
        }
        .wl-lang-current, .wl-lang-btn {
          width:42px;
          height:42px;
          border:3px solid #ffe080;
          background:#0d0d22;
          color:#fff;
          font-size:22px;
          cursor:pointer;
          box-shadow:3px 3px 0 rgba(0,0,0,0.35);
        }
        .wl-lang-menu {
          display:grid;
          grid-template-columns:repeat(5, 1fr);
          gap:6px;
          background:rgba(13,13,34,0.92);
          border:2px solid #4a4a8a;
          padding:8px;
          width:max-content;
        }
        .wl-lang-menu--hidden {
          display:none;
        }
        .wl-lang-btn--sel {
          border-color:#40d060;
          background:#102010;
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
