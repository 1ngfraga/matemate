import { Settings } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'

export class SettingsScreen implements BaseScreen {
  constructor(
    private navigate: NavigateFn,
    private settings: Settings,
    private onSettingsChange: (s: Settings) => void,
  ) {}

  mount(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;
        font-family:'Courier New',monospace;color:#f0c040;font-size:24px;">
        SETTINGS — Step 5 (próximo)
      </div>`
  }

  unmount(): void {}
}
