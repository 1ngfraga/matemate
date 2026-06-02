import { Settings } from '../core/Types'
import { storage } from '../storage/StorageService'

export class App {
  private settings: Settings

  constructor(private root: HTMLElement) {
    this.settings = storage.loadSettings()
  }

  start() {
    this.root.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 24px;
        font-family: 'Courier New', monospace;
        color: #f0c040;
      ">
        <div style="font-size: 48px;">🦕</div>
        <div style="font-size: 32px; letter-spacing: 4px;">MATEMATE</div>
        <div style="font-size: 12px; color: #40d060;">
          Storage OK · animal: ${this.settings.animal} · timer: ${this.settings.timerDuration}s
        </div>
        <div style="font-size: 11px; color: #8888aa;">Step 2 completo</div>
      </div>
    `
  }

  getSettings(): Settings { return this.settings }

  updateSettings(next: Settings) {
    this.settings = next
    storage.saveSettings(next)
  }
}
