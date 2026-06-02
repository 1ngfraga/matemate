import { Screen, Settings } from '../core/Types'
import { storage } from '../storage/StorageService'
import { ScreenManager } from './ScreenManager'

export type NavigateFn = (screen: Screen, params?: unknown) => void

export class Router {
  private settings: Settings

  constructor(private manager: ScreenManager) {
    this.settings = storage.loadSettings()
  }

  getSettings(): Settings { return this.settings }

  updateSettings(next: Settings): void {
    this.settings = next
    storage.saveSettings(next)
  }

  navigate: NavigateFn = async (screen: Screen, params?: unknown) => {
    // Lazy-import each screen to keep initial bundle small
    switch (screen) {
      case Screen.Welcome: {
        const { WelcomeScreen } = await import('../screens/WelcomeScreen')
        await this.manager.show(new WelcomeScreen(this.navigate))
        break
      }
      case Screen.Home: {
        const { HomeScreen } = await import('../screens/HomeScreen')
        await this.manager.show(
          new HomeScreen(this.navigate, this.settings, (s) => this.updateSettings(s)),
        )
        break
      }
      case Screen.Settings: {
        const { SettingsScreen } = await import('../screens/SettingsScreen')
        await this.manager.show(
          new SettingsScreen(this.navigate, this.settings, (s) => this.updateSettings(s)),
        )
        break
      }
      case Screen.Game: {
        const { GameScreen } = await import('../screens/GameScreen')
        await this.manager.show(
          new GameScreen(this.navigate, this.settings, params as import('../core/Types').Operation),
        )
        break
      }
      case Screen.Result: {
        const { ResultScreen } = await import('../screens/ResultScreen')
        await this.manager.show(
          new ResultScreen(this.navigate, params as import('../core/Types').GameResult),
        )
        break
      }
    }
  }
}
