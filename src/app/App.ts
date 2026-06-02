import { Screen } from '../core/Types'
import { ScreenManager } from './ScreenManager'
import { Router } from './Router'

export class App {
  private manager: ScreenManager
  private router: Router

  constructor(root: HTMLElement) {
    this.manager = new ScreenManager(root)
    this.router  = new Router(this.manager)
  }

  start() {
    this.router.navigate(Screen.Welcome)
  }
}
