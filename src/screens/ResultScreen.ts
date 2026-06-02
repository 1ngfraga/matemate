import { GameResult } from '../core/Types'
import { NavigateFn } from '../app/Router'
import { BaseScreen } from '../app/ScreenManager'

export class ResultScreen implements BaseScreen {
  constructor(
    private navigate: NavigateFn,
    private result: GameResult,
  ) {}

  mount(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;
        font-family:'Courier New',monospace;color:#f0c040;font-size:24px;">
        RESULT — Step 11 (próximo)
      </div>`
  }

  unmount(): void {}
}
