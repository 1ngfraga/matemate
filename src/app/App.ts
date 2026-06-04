import { Screen } from '../core/Types'
import { addNativeBackButtonListener, configureNativeShell } from '../core/NativePlatform'
import { ScreenManager } from './ScreenManager'
import { Router } from './Router'

export class App {
  private manager: ScreenManager
  private router: Router

  constructor(root: HTMLElement) {
    this.manager = new ScreenManager(root)
    this.router  = new Router(this.manager)
  }

  async start() {
    addNativeBackButtonListener(
      () => this.router.getCurrentScreen(),
      (screen) => {
        if (screen !== Screen.Welcome) return this.router.handleSystemBack()
      },
    )
    await configureNativeShell()
    await this.router.navigate(Screen.Welcome)
  }
}
