import { GameMode, GameResult, Operation, Screen, Settings } from '../core/Types'
import { storage } from '../storage/StorageService'
import { ScreenManager } from './ScreenManager'

export interface ResultScreenParams {
  result: GameResult
  mode: GameMode
  animal: Settings['animal']
}

export type NavigateFn = (screen: Screen, params?: unknown) => void

export class Router {
  private currentScreen: Screen = Screen.Welcome
  private activeMode: GameMode = GameMode.Play
  private lastOperation: Operation = Operation.Addition
  private settingsByMode = storage.loadAppState().profiles

  constructor(private manager: ScreenManager) {}

  getSettings(mode: GameMode = this.activeMode): Settings {
    return structuredClone(this.settingsByMode[mode])
  }

  getActiveMode(): GameMode {
    return this.activeMode
  }

  getCurrentScreen(): Screen {
    return this.currentScreen
  }

  hasPin(): boolean {
    return !!storage.loadPin()
  }

  updateSettings(mode: GameMode, next: Settings): void {
    this.settingsByMode[mode] = structuredClone(next)
    if (mode === this.activeMode) this.activeMode = mode
    storage.saveSettings(mode, next)
  }

  navigate: NavigateFn = async (screen: Screen, params?: unknown) => {
    this.currentScreen = screen
    switch (screen) {
      case Screen.Welcome: {
        const { WelcomeScreen } = await import('../screens/WelcomeScreen')
        await this.manager.show(new WelcomeScreen(this.navigate))
        break
      }
      case Screen.Home: {
        if (params === GameMode.Play || params === GameMode.Free) {
          this.activeMode = params
        }
        const { HomeScreen } = await import('../screens/HomeScreen')
        await this.manager.show(
          new HomeScreen(
            this.navigate,
            this.activeMode,
            this.getSettings(this.activeMode),
            (mode, s) => this.updateSettings(mode, s),
          ),
        )
        break
      }
      case Screen.Settings: {
        const { SettingsScreen } = await import('../screens/SettingsScreen')
        await this.manager.show(
          new SettingsScreen(
            this.navigate,
            this.activeMode,
            this.getSettings(this.activeMode),
            (mode, s) => this.updateSettings(mode, s),
          ),
        )
        break
      }
      case Screen.Game: {
        const { GameScreen } = await import('../screens/GameScreen')
        this.lastOperation = params as Operation
        await this.manager.show(
          new GameScreen(
            this.navigate,
            this.activeMode,
            this.getSettings(this.activeMode),
            this.lastOperation,
          ),
        )
        break
      }
      case Screen.Result: {
        const { ResultScreen } = await import('../screens/ResultScreen')
        await this.manager.show(
          new ResultScreen(this.navigate, params as ResultScreenParams),
        )
        break
      }
    }
  }

  async handleSystemBack(): Promise<void> {
    switch (this.currentScreen) {
      case Screen.Settings:
      case Screen.Game:
      case Screen.Result:
        await this.navigate(Screen.Home, this.activeMode)
        break
      case Screen.Home:
        await this.navigate(Screen.Welcome)
        break
      case Screen.Welcome:
        break
      default:
        await this.navigate(Screen.Home, this.activeMode)
        break
    }
  }
}
